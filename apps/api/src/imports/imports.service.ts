import {
    Injectable,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { $Enums } from '@prisma/client';
import { AccountsService } from '../accounts/accounts.service';

type TradeSymbol = $Enums.Symbol;

interface RawTrade {
    tradeDate: Date;
    symbol: TradeSymbol;
    quantity: number;
    pnl: number;
    fees?: number;
    side?: string;
}

@Injectable()
export class ImportsService {
    constructor(
        private prisma: PrismaService,
        private accountsService: AccountsService,
    ) { }

    async createImport(userId: string, file: Express.Multer.File) {
        const imp = await this.prisma.import.create({
            data: {
                userId,
                filenameOriginal: file.originalname,
                status: 'PENDING',
            },
        });

        // Process synchronously (simple V1 - no queue needed)
        this.processFile(imp.id, userId, file).catch(async (err) => {
            await this.prisma.import.update({
                where: { id: imp.id },
                data: { status: 'ERROR', errorMessage: err.message, finishedAt: new Date() },
            });
        });

        return { id: imp.id, status: 'PENDING' };
    }

    private async processFile(
        importId: string,
        userId: string,
        file: Express.Multer.File,
    ) {
        await this.prisma.import.update({
            where: { id: importId },
            data: { status: 'PROCESSING', startedAt: new Date() },
        });

        let rawTrades: RawTrade[] = [];
        let detectedAccountNumber: string | null = null;

        const ext = file.originalname.toLowerCase();
        if (ext.endsWith('.csv')) {
            const parsed = this.parseCsv(file.buffer);
            rawTrades = parsed.trades;
            detectedAccountNumber = parsed.accountNumber;
        } else if (ext.endsWith('.xlsx') || ext.endsWith('.xls')) {
            rawTrades = this.parseXlsx(file.buffer);
        } else {
            throw new BadRequestException('Unsupported file format. Use CSV or XLSX.');
        }

        let accountId: string | null = null;
        if (detectedAccountNumber) {
            const account = await this.accountsService.findOrCreateByAccountNumber(userId, detectedAccountNumber);
            accountId = account.id;

            // Link account to the import
            await this.prisma.import.update({
                where: { id: importId },
                data: { accountId },
            });
        }

        let imported = 0;
        let skipped = 0;

        for (const raw of rawTrades) {
            const hash = this.makeHash(userId, raw);

            const exists = await this.prisma.trade.findUnique({
                where: { userId_externalHash: { userId, externalHash: hash } },
            });

            if (exists) {
                skipped++;
                continue;
            }

            await this.prisma.trade.create({
                data: {
                    userId,
                    importId,
                    accountId,
                    tradeDate: raw.tradeDate,
                    symbol: raw.symbol,
                    quantity: raw.quantity,
                    pnl: raw.pnl,
                    fees: raw.fees,
                    externalHash: hash,
                },
            });

            imported++;
        }

        // Rebuild daily stats for this user
        await this.rebuildDailyStats(userId);

        await this.prisma.import.update({
            where: { id: importId },
            data: {
                status: 'DONE',
                finishedAt: new Date(),
                totalRows: rawTrades.length,
                importedRows: imported,
                skippedRows: skipped,
            },
        });
    }

    private parseCsv(buffer: Buffer): { trades: RawTrade[], accountNumber: string | null } {
        // Profit Chart exports are ISO-8859-1 (Latin1) encoded, not UTF-8
        let content = buffer.toString('latin1');

        let accountNumber: string | null = null;

        // Fix garbled Brazilian chars directly in the raw string before parsing
        content = content.replace(/Operao/gi, 'Operacao').replace(/Preo/gi, 'Preco');

        // Profit Chart exports contain 5 lines of metadata before the actual CSV headers start
        if (content.startsWith('Conta:') || content.startsWith('Titular:')) {
            const lines = content.split('\n');
            const accountLine = lines.find(l => l.startsWith('Conta:'));
            if (accountLine) {
                accountNumber = accountLine.replace('Conta:', '').trim();
            }

            const headerIndex = lines.findIndex(line => line.includes('Subconta;') || line.includes('Subconta,'));
            if (headerIndex !== -1) {
                // Slice everything before the actual table header
                content = lines.slice(headerIndex).join('\n');
            }
        }

        // Auto-detect delimiter to avoid splitting on decimal commas in PT-BR formatting
        const firstLine = content.split('\n')[0];
        const detectedDelimiter = firstLine.includes(';') ? ';' : ',';

        const records = parse(content, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            delimiter: detectedDelimiter,
        });

        const trades = records.map((r: Record<string, string>) => this.normalizeRow(r));
        return { trades, accountNumber };
    }

    private parseXlsx(buffer: Buffer): RawTrade[] {
        const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const rows: Record<string, string>[] = XLSX.utils.sheet_to_json(sheet, {
            raw: false,
        });
        return rows.map((r) => this.normalizeRow(r));
    }

    private normalizeRow(row: Record<string, string>): RawTrade {
        // Find best matching keys
        const keys = Object.keys(row);

        let dateKey = keys.find(k => /data|date|abertura|hora/i.test(k));
        let symbolKey = keys.find(k => /ativo|symbol|papel/i.test(k));
        let qtyKey = keys.find(k => /qtd|quant|lotes/i.test(k));
        let pnlKey = keys.find(k => /res.*opera|resultado|lucro|pnl|total/i.test(k) && !k.includes('%'));

        const dateRaw = dateKey ? row[dateKey] : null;
        const symbolRaw = symbolKey ? row[symbolKey] : null;
        const quantityRaw = qtyKey ? row[qtyKey] : null;
        const pnlRaw = pnlKey ? row[pnlKey] : null;

        if (!dateRaw || !symbolRaw || !pnlRaw) {
            throw new BadRequestException(
                `Missing required columns. Found: ${Object.keys(row).join(', ')}`,
            );
        }

        let tradeDate: Date;
        const match = String(dateRaw).match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2}):(\d{2}))?/);
        if (match) {
            const [_, day, month, year, hh, mm, ss] = match;
            tradeDate = new Date(`${year}-${month}-${day}T${hh || '00'}:${mm || '00'}:${ss || '00'}Z`);
        } else {
            tradeDate = new Date(dateRaw);
        }

        if (isNaN(tradeDate.getTime())) {
            throw new BadRequestException(`Invalid date: ${dateRaw}`);
        }

        const symbol = this.normalizeSymbol(symbolRaw);
        const quantity = Math.abs(parseFloat(String(quantityRaw).replace(',', '.')) || 1);
        const pnl = parseFloat(
            String(pnlRaw).replace(/R\$\s*/g, '').replace(/\./g, '').replace(',', '.'),
        );

        if (isNaN(pnl)) throw new BadRequestException(`Invalid pnl: ${pnlRaw}`);

        return { tradeDate, symbol, quantity, pnl };
    }

    private normalizeSymbol(raw: string): TradeSymbol {
        const s = raw.toUpperCase();
        if (s.includes('WIN')) return 'WIN';
        if (s.includes('WDO') || s.includes('DOL')) return 'WDO';
        if (s.includes('BTC') || s.includes('BIT')) return 'BTC';
        return 'OTHER';
    }

    private makeHash(userId: string, t: RawTrade): string {
        const str = `${userId}-${t.tradeDate.toISOString()}-${t.symbol}-${t.quantity}-${t.pnl}`;
        return crypto.createHash('sha256').update(str).digest('hex');
    }

    private async rebuildDailyStats(userId: string) {
        const trades = await this.prisma.trade.findMany({
            where: { userId },
            select: { tradeDate: true, pnl: true, accountId: true },
        });

        const byDate = new Map<
            string,
            { userId: string; accountId: string | null; date: Date; totalPnl: number; totalTrades: number; wins: number; losses: number }
        >();

        for (const t of trades) {
            const dateKey = t.tradeDate.toISOString().split('T')[0];
            const accountId = t.accountId || 'unassigned';
            const key = `${dateKey}_${accountId}`;

            const existing = byDate.get(key) || {
                userId,
                accountId: t.accountId,
                date: new Date(dateKey),
                totalPnl: 0,
                totalTrades: 0,
                wins: 0,
                losses: 0,
            };
            const pnl = Number(t.pnl);
            byDate.set(key, {
                ...existing,
                totalPnl: existing.totalPnl + pnl,
                totalTrades: existing.totalTrades + 1,
                wins: existing.wins + (pnl > 0 ? 1 : 0),
                losses: existing.losses + (pnl < 0 ? 1 : 0),
            });
        }

        // Drop all existing stats for this user to avoid unique constraint issues after schema change
        await this.prisma.dailyStat.deleteMany({ where: { userId } });

        for (const stats of byDate.values()) {
            await this.prisma.dailyStat.create({
                data: stats,
            });
        }
    }

    async listImports(userId: string) {
        return this.prisma.import.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                filenameOriginal: true,
                status: true,
                totalRows: true,
                importedRows: true,
                skippedRows: true,
                errorMessage: true,
                startedAt: true,
                finishedAt: true,
                createdAt: true,
            },
        });
    }

    async getImport(userId: string, id: string) {
        const imp = await this.prisma.import.findFirst({
            where: { id, userId },
        });
        if (!imp) throw new NotFoundException('Import not found');
        return imp;
    }

    async deleteImport(userId: string, id: string) {
        const imp = await this.prisma.import.findFirst({
            where: { id, userId },
        });
        if (!imp) throw new NotFoundException('Import not found');

        await this.prisma.import.delete({ where: { id } });
        await this.rebuildDailyStats(userId);

        return { deleted: true };
    }
}
