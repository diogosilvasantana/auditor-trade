import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChallengeDto } from './dto/challenge.dto';

@Injectable()
export class PropService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, dto: CreateChallengeDto) {
        return this.prisma.propChallenge.create({
            data: {
                userId,
                name: dto.name,
                type: dto.type,
                status: dto.status,
                profitTarget: dto.profitTarget,
                dailyMaxLoss: dto.dailyMaxLoss,
                totalMaxDrawdown: dto.totalMaxDrawdown,
                allowedSymbols: dto.allowedSymbols,
                maxContractsBySymbol: dto.maxContractsBySymbol ?? {},
                rulesText: dto.rulesText,
                startDate: dto.startDate ? new Date(dto.startDate) : null,
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                accountId: dto.accountId,
                winFee: dto.winFee,
                wdoFee: dto.wdoFee,
            },
        });
    }

    async list(userId: string) {
        return this.prisma.propChallenge.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { account: true },
        });
    }

    async update(userId: string, id: string, dto: Partial<CreateChallengeDto>) {
        const challenge = await this.prisma.propChallenge.findFirst({
            where: { id, userId },
        });
        if (!challenge) throw new NotFoundException('Challenge not found');

        return this.prisma.propChallenge.update({
            where: { id },
            data: {
                ...dto,
                type: dto.type,
                status: dto.status,
                startDate: dto.startDate ? new Date(dto.startDate) : undefined,
                endDate: dto.endDate ? new Date(dto.endDate) : undefined,
            },
        });
    }

    async delete(userId: string, id: string) {
        const challenge = await this.prisma.propChallenge.findFirst({
            where: { id, userId },
        });
        if (!challenge) throw new NotFoundException('Challenge not found');

        return this.prisma.propChallenge.delete({
            where: { id },
        });
    }

    async getPlan(userId: string, id: string) {
        const challenge = await this.prisma.propChallenge.findFirst({
            where: { id, userId },
        });
        if (!challenge) throw new NotFoundException('Challenge not found');

        // Compute recommended plan based on challenge rules
        const recommendedDailyRisk = Number(challenge.dailyMaxLoss) * 0.7;
        const recommendedMaxTrades = 5;

        return {
            challenge,
            approvalPlan: {
                recommendedDailyRisk: recommendedDailyRisk.toFixed(2),
                recommendedMaxTradesPerDay: recommendedMaxTrades,
                focusSymbols: challenge.allowedSymbols,
                stopRules: [
                    `Pare ao atingir perda de R$ ${recommendedDailyRisk.toFixed(0)}/dia`,
                    'Faça pausa de 15 min após 2 perdas consecutivas',
                    'Não opere na última hora antes do mercado fechar',
                ],
                notes: challenge.rulesText,
            },
        };
    }

    async getProgress(userId: string, id: string, q: { start?: string; end?: string }) {
        const challenge = await this.prisma.propChallenge.findFirst({
            where: { id, userId },
            include: { account: true },
        });
        if (!challenge) throw new NotFoundException('Challenge not found');

        const account = challenge.account;
        const profitSplit = account?.profitSplit ? Number(account.profitSplit) / 100 : 1;

        const gte = q.start
            ? new Date(q.start)
            : challenge.startDate ?? new Date(0);
        const lte = q.end
            ? new Date(q.end)
            : challenge.endDate ?? new Date();

        const trades = await this.prisma.trade.findMany({
            where: {
                userId,
                accountId: challenge.accountId || undefined,
                tradeDate: { gte, lte },
                symbol: {
                    in: (challenge.allowedSymbols as string[]).map((s) => s as any),
                },
            },
            select: { pnl: true, tradeDate: true, accountId: true, quantity: true },
            orderBy: { tradeDate: 'asc' },
        });

        const stats = trades.reduce((acc: { totalGrossPnl: number; totalNetPnl: number; totalTrades: number; wins: number; losses: number }, t: any) => {
            const netPnl = Number(t.pnl);

            acc.totalGrossPnl += netPnl; // Since we don't save DB gross PnL anymore, map Gross to Net
            acc.totalNetPnl += netPnl;
            acc.totalTrades++;
            if (netPnl > 0) acc.wins++;
            else if (netPnl < 0) acc.losses++;
            return acc;
        }, { totalGrossPnl: 0, totalNetPnl: 0, totalTrades: 0, wins: 0, losses: 0 });

        const target = Number(challenge.profitTarget) || 1;
        const maxDD = Number(challenge.totalMaxDrawdown) || 1;

        const totalPnlBeforeSplit = stats.totalNetPnl;
        const totalPnlAfterSplit = totalPnlBeforeSplit > 0 ? totalPnlBeforeSplit * profitSplit : totalPnlBeforeSplit;

        const winRate = stats.totalTrades > 0 ? (stats.wins / stats.totalTrades) * 100 : 0;

        const safeDiv = (n: number, d: number) => (d === 0 ? 0 : n / d);

        // Total Loss Limit calculation
        const totalLossUsed = totalPnlBeforeSplit < 0 ? Math.abs(totalPnlBeforeSplit) : 0;
        const lossRemaining = maxDD + totalPnlBeforeSplit; // If positive, adds to margin. If negative, subtracts.
        const lossPercent = totalPnlBeforeSplit < 0 ? Math.min((totalLossUsed / maxDD) * 100, 100) : 0;

        const isTargetReached = totalPnlBeforeSplit >= target;
        const isLossLimitReached = totalLossUsed >= maxDD;

        const safeFixed = (val: number, digits: number) => {
            if (isNaN(val) || !isFinite(val)) return (0).toFixed(digits);
            return val.toFixed(digits);
        };

        return {
            challenge,
            progress: {
                totalPnl: safeFixed(totalPnlBeforeSplit, 2),
                totalPnlAfterSplit: safeFixed(totalPnlAfterSplit, 2),
                totalTrades: stats.totalTrades || 0,
                distanceToTarget: safeFixed(target - totalPnlBeforeSplit, 2),
                progressPercent: safeFixed(safeDiv(totalPnlBeforeSplit, target) * 100, 1),
                lossUsed: safeFixed(totalLossUsed, 2),
                lossPercent: safeFixed(lossPercent, 1),
                lossRemaining: safeFixed(lossRemaining, 2),
                isTargetReached,
                isLossLimitReached,
                tradingDays: new Set(trades.map((t: any) => t.tradeDate?.toISOString().split('T')[0]).filter(Boolean))
                    .size,
            },
        };
    }
}
