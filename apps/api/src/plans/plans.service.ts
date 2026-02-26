import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePlanDto } from './dto/plan.dto';

@Injectable()
export class PlansService {
    constructor(private prisma: PrismaService) { }

    async getActive(userId: string) {
        return this.prisma.tradePlan.findFirst({
            where: { userId, isActive: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async create(userId: string, dto: CreatePlanDto) {
        // Deactivate existing active plans
        await this.prisma.tradePlan.updateMany({
            where: { userId, isActive: true },
            data: { isActive: false },
        });

        return this.prisma.tradePlan.create({
            data: {
                userId,
                name: dto.name,
                dailyLossLimit: dto.dailyLossLimit,
                maxTradesPerDay: dto.maxTradesPerDay,
                allowedTimeWindows: dto.allowedTimeWindows ?? [],
                maxContractsBySymbol: dto.maxContractsBySymbol ?? {},
                pauseAfterConsecutiveLosses: dto.pauseAfterConsecutiveLosses ?? 3,
                pauseMinutes: dto.pauseMinutes ?? 15,
                isActive: true,
            },
        });
    }

    async update(userId: string, id: string, dto: Partial<CreatePlanDto>) {
        const plan = await this.prisma.tradePlan.findFirst({
            where: { id, userId },
        });
        if (!plan) throw new NotFoundException('Plan not found');

        return this.prisma.tradePlan.update({
            where: { id },
            data: dto,
        });
    }

    async getViolations(userId: string, q: { start?: string; end?: string }) {
        const plan = await this.getActive(userId);
        if (!plan) return { violations: [], plan: null };

        const gte = q.start ? new Date(q.start) : undefined;
        const lte = q.end ? new Date(q.end) : undefined;

        const trades = await this.prisma.trade.findMany({
            where: { userId, tradeDate: { gte, lte } },
            select: { tradeDate: true, pnl: true },
            orderBy: { tradeDate: 'asc' },
        });

        const violations: any[] = [];
        const byDay = new Map<string, { pnls: number[]; trades: number }>();

        for (const t of trades) {
            const key = t.tradeDate.toISOString().split('T')[0];
            const day = byDay.get(key) || { pnls: [], trades: 0 };
            day.pnls.push(Number(t.pnl));
            day.trades++;
            byDay.set(key, day);
        }

        for (const [date, day] of byDay) {
            const dayPnl = day.pnls.reduce((s, v) => s + v, 0);

            if (day.trades > plan.maxTradesPerDay) {
                violations.push({
                    date,
                    type: 'MAX_TRADES_EXCEEDED',
                    description: `Operou ${day.trades} vezes (limite: ${plan.maxTradesPerDay})`,
                    severity: 'HIGH',
                });
            }

            if (dayPnl < -Number(plan.dailyLossLimit)) {
                violations.push({
                    date,
                    type: 'DAILY_LOSS_EXCEEDED',
                    description: `Perda do dia: R$ ${Math.abs(dayPnl).toFixed(0)} (limite: R$ ${Number(plan.dailyLossLimit).toFixed(0)})`,
                    severity: 'CRITICAL',
                });
            }
        }

        return { violations, plan };
    }
}
