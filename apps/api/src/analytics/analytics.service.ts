import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface DateRangeQuery {
    start?: string;
    end?: string;
    accountId?: string;
}

@Injectable()
export class AnalyticsService {
    constructor(private prisma: PrismaService) { }

    private dateRange(q: DateRangeQuery) {
        const gte = q.start ? new Date(q.start) : undefined;
        const lte = q.end ? new Date(q.end) : undefined;
        return { gte, lte };
    }

    async getOverview(userId: string, q: DateRangeQuery) {
        let { accountId } = q;
        if (accountId === 'all' || accountId === '' || accountId === 'undefined') accountId = undefined;

        const range = this.dateRange(q);
        console.log(`[Analytics] getOverview userId=${userId} range=${JSON.stringify(range)}`);

        const stats = await this.prisma.dailyStat.findMany({
            where: {
                userId,
                accountId: accountId || undefined,
                date: { gte: range.gte, lte: range.lte },
            },
            orderBy: { date: 'asc' },
        });
        console.log(`[Analytics] getOverview stats.length=${stats.length}`);

        const totalPnl = stats.reduce((s: number, d: any) => s + Number(d.totalPnl), 0);
        const totalTrades = stats.reduce((s: number, d: any) => s + d.totalTrades, 0);
        const totalWins = stats.reduce((s: number, d: any) => s + d.wins, 0);
        const totalLosses = stats.reduce((s: number, d: any) => s + d.losses, 0);
        const winRate =
            totalWins + totalLosses > 0
                ? ((totalWins / (totalWins + totalLosses)) * 100).toFixed(1)
                : '0';

        return {
            summary: {
                totalPnl: totalPnl.toFixed(2),
                totalTrades,
                totalWins,
                totalLosses,
                winRate: `${winRate}%`,
                tradingDays: stats.length,
            },
            daily: stats.map((d: any) => ({
                date: d.date,
                pnl: Number(d.totalPnl),
                trades: d.totalTrades,
                wins: d.wins,
                losses: d.losses,
            })),
        };
    }

    async getBySymbol(userId: string, q: DateRangeQuery) {
        let { accountId } = q;
        if (accountId === 'all' || accountId === '' || accountId === 'undefined') accountId = undefined;

        const range = this.dateRange(q);
        console.log(`[Analytics] getBySymbol userId=${userId} range=${JSON.stringify(range)}`);

        const trades = await this.prisma.trade.findMany({
            where: {
                userId,
                accountId: accountId || undefined,
                tradeDate: { gte: range.gte, lte: range.lte },
            },
            select: { symbol: true, pnl: true, tradeDate: true },
        });
        console.log(`[Analytics] getBySymbol trades.length=${trades.length}`);

        const bySymbol = new Map<
            string,
            { pnls: number[]; wins: number; losses: number; days: Set<string> }
        >();

        for (const t of trades) {
            const existing = bySymbol.get(t.symbol) || {
                pnls: [],
                wins: 0,
                losses: 0,
                days: new Set(),
            };
            const pnl = Number(t.pnl);
            existing.pnls.push(pnl);
            pnl > 0 ? existing.wins++ : existing.losses++;
            existing.days.add(t.tradeDate.toISOString().split('T')[0]);
            bySymbol.set(t.symbol, existing);
        }

        return Array.from(bySymbol.entries()).map(([symbol, data]) => {
            const total = data.pnls.reduce((s, v) => s + v, 0);
            const avg = total / data.pnls.length;
            const std = Math.sqrt(
                data.pnls.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / data.pnls.length,
            );
            const positiveDays =
                data.days.size > 0 ? (data.wins / data.days.size) * 100 : 0;

            return {
                symbol,
                totalPnl: total.toFixed(2),
                avgPnlPerTrade: avg.toFixed(2),
                totalTrades: data.pnls.length,
                wins: data.wins,
                losses: data.losses,
                consistency: std.toFixed(2),
                positiveDaysPercent: positiveDays.toFixed(1),
            };
        });
    }

    async getHeatmap(userId: string, q: DateRangeQuery & { symbol?: string; bucket?: number }) {
        let { accountId } = q;
        if (accountId === 'all' || accountId === '' || accountId === 'undefined') accountId = undefined;

        const range = this.dateRange(q);
        const bucketMin = q.bucket ? parseInt(String(q.bucket)) : 30;

        const where: any = {
            userId,
            accountId: accountId || undefined,
            tradeDate: { gte: range.gte, lte: range.lte },
        };
        if (q.symbol) where.symbol = q.symbol;

        const trades = await this.prisma.trade.findMany({
            where,
            select: { tradeDate: true, pnl: true },
        });

        console.log(`[Analytics] getHeatmap userId=${userId} trades.length=${trades.length}`);

        const buckets = new Map<
            string,
            { totalPnl: number; count: number; label: string }
        >();

        for (const t of trades) {
            const h = t.tradeDate.getUTCHours();
            const m = t.tradeDate.getUTCMinutes();
            const totalMins = h * 60 + m;
            const bucketStart = Math.floor(totalMins / bucketMin) * bucketMin;
            const bh = Math.floor(bucketStart / 60);
            const bm = bucketStart % 60;
            const key = `${String(bh).padStart(2, '0')}:${String(bm).padStart(2, '0')}`;

            const entry = buckets.get(key) || { totalPnl: 0, count: 0, label: key };
            entry.totalPnl += Number(t.pnl);
            entry.count++;
            buckets.set(key, entry);
        }

        return Array.from(buckets.entries())
            .map(([time, data]) => ({
                time,
                totalPnl: data.totalPnl.toFixed(2),
                avgPnl: (data.totalPnl / data.count).toFixed(2),
                count: data.count,
            }))
            .sort((a, b) => a.time.localeCompare(b.time));
    }

    async getByWeekday(userId: string, q: DateRangeQuery) {
        let { accountId } = q;
        if (accountId === 'all' || accountId === '' || accountId === 'undefined') accountId = undefined;

        const range = this.dateRange(q);
        console.log(`[Analytics] getByWeekday userId=${userId} range=${JSON.stringify(range)}`);
        const trades = await this.prisma.trade.findMany({
            where: {
                userId,
                accountId: accountId || undefined,
                tradeDate: { gte: range.gte, lte: range.lte },
            },
            select: { tradeDate: true, pnl: true },
        });

        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const byDay = new Array(7).fill(null).map((_, i) => ({
            day: days[i],
            dayIndex: i,
            totalPnl: 0,
            totalTrades: 0,
        }));

        for (const t of trades) {
            const idx = t.tradeDate.getDay();
            byDay[idx].totalPnl += Number(t.pnl);
            byDay[idx].totalTrades++;
        }

        return byDay.map((d) => ({
            ...d,
            avgPnl: d.totalTrades > 0 ? (d.totalPnl / d.totalTrades).toFixed(2) : '0',
            totalPnl: d.totalPnl.toFixed(2),
        }));
    }

    async getTrades(userId: string, q: DateRangeQuery) {
        let { accountId } = q;
        if (accountId === 'all' || accountId === '' || accountId === 'undefined') accountId = undefined;

        const range = this.dateRange(q);
        console.log(`[Analytics] getTrades userId=${userId} range=${JSON.stringify(range)}`);
        const trades = await this.prisma.trade.findMany({
            where: {
                userId,
                accountId: accountId || undefined,
                tradeDate: { gte: range.gte, lte: range.lte },
            },
            orderBy: { tradeDate: 'desc' },
        });

        return trades.map((t: any) => ({
            id: t.id,
            tradeDate: t.tradeDate,
            symbol: t.symbol,
            quantity: t.quantity,
            pnl: Number(t.pnl).toFixed(2),
        }));
    }
}
