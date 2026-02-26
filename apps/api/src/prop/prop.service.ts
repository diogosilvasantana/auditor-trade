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
                profitTarget: dto.profitTarget,
                dailyMaxLoss: dto.dailyMaxLoss,
                totalMaxDrawdown: dto.totalMaxDrawdown,
                allowedSymbols: dto.allowedSymbols,
                maxContractsBySymbol: dto.maxContractsBySymbol ?? {},
                rulesText: dto.rulesText,
                startDate: dto.startDate ? new Date(dto.startDate) : null,
                endDate: dto.endDate ? new Date(dto.endDate) : null,
            },
        });
    }

    async list(userId: string) {
        return this.prisma.propChallenge.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
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
        });
        if (!challenge) throw new NotFoundException('Challenge not found');

        const gte = q.start
            ? new Date(q.start)
            : challenge.startDate ?? new Date(0);
        const lte = q.end
            ? new Date(q.end)
            : challenge.endDate ?? new Date();

        const trades = await this.prisma.trade.findMany({
            where: {
                userId,
                tradeDate: { gte, lte },
                symbol: {
                    in: (challenge.allowedSymbols as string[]).map((s) => s as any),
                },
            },
            select: { pnl: true, tradeDate: true },
            orderBy: { tradeDate: 'asc' },
        });

        const totalPnl = trades.reduce((s, t) => s + Number(t.pnl), 0);
        const totalTrades = trades.length;

        let runningBalance = 0;
        let maxDrawdown = 0;
        let peak = 0;

        for (const t of trades) {
            runningBalance += Number(t.pnl);
            if (runningBalance > peak) peak = runningBalance;
            const dd = peak - runningBalance;
            if (dd > maxDrawdown) maxDrawdown = dd;
        }

        const target = Number(challenge.profitTarget);
        const maxDD = Number(challenge.totalMaxDrawdown);

        return {
            challenge,
            progress: {
                totalPnl: totalPnl.toFixed(2),
                totalTrades,
                distanceToTarget: (target - totalPnl).toFixed(2),
                progressPercent: Math.min(100, ((totalPnl / target) * 100)).toFixed(1),
                maxDrawdownUsed: maxDrawdown.toFixed(2),
                drawdownPercent: ((maxDrawdown / maxDD) * 100).toFixed(1),
                drawdownRemaining: (maxDD - maxDrawdown).toFixed(2),
                tradingDays: new Set(trades.map((t) => t.tradeDate.toISOString().split('T')[0]))
                    .size,
            },
        };
    }
}
