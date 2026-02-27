import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface DateRangeQuery {
    start?: string;
    end?: string;
    accountId?: string;
}

@Injectable()
export class InsightsService {
    constructor(private prisma: PrismaService) { }

    private dateRange(q: DateRangeQuery) {
        return {
            gte: q.start ? new Date(q.start) : undefined,
            lte: q.end ? new Date(q.end) : undefined,
        };
    }

    async getInsights(userId: string, q: DateRangeQuery) {
        let { accountId } = q;
        if (accountId === 'all' || accountId === '' || accountId === 'undefined') accountId = undefined;

        const range = this.dateRange(q);
        const rawTrades = await this.prisma.trade.findMany({
            where: {
                userId,
                accountId: accountId || undefined,
                tradeDate: { gte: range.gte, lte: range.lte },
            },
            select: { tradeDate: true, symbol: true, pnl: true },
        });

        // Normalize Prisma Decimal to number
        const trades = rawTrades.map((t) => ({
            tradeDate: t.tradeDate,
            symbol: t.symbol as string,
            pnl: Number(t.pnl),
        }));

        if (trades.length < 10) {
            return {
                insights: [],
                message: 'Importe pelo menos 10 operações para gerar insights.',
            };
        }

        const insights = [];

        // Insight 1: Overtrading
        const overtrading = this.computeOvertrading(trades);
        if (overtrading) insights.push(overtrading);

        // Insight 2: Worst time
        const worstTime = this.computeWorstTime(trades);
        if (worstTime) insights.push(worstTime);

        // Insight 3: Focus symbol
        const focusSymbol = this.computeFocusSymbol(trades);
        if (focusSymbol) insights.push(focusSymbol);

        return { insights };
    }

    private computeOvertrading(trades: { tradeDate: Date; pnl: number }[]) {
        const byDay = new Map<string, number[]>();
        for (const t of trades) {
            const key = t.tradeDate.toISOString().split('T')[0];
            const list = byDay.get(key) || [];
            list.push(Number(t.pnl));
            byDay.set(key, list);
        }

        const dayCounts = Array.from(byDay.values()).map((v) => v.length);
        dayCounts.sort((a, b) => a - b);

        const p75 = dayCounts[Math.floor(dayCounts.length * 0.75)];

        const highDays: { count: number; pnl: number }[] = [];
        const normalDays: { count: number; pnl: number }[] = [];

        for (const [, pnls] of byDay) {
            const dayPnl = pnls.reduce((s, v) => s + v, 0);
            if (pnls.length > p75) highDays.push({ count: pnls.length, pnl: dayPnl });
            else normalDays.push({ count: pnls.length, pnl: dayPnl });
        }

        if (highDays.length < 3) return null;

        const avgHighPnl = highDays.reduce((s, d) => s + d.pnl, 0) / highDays.length;
        const avgNormalPnl = normalDays.reduce((s, d) => s + d.pnl, 0) / normalDays.length;

        if (avgHighPnl >= avgNormalPnl) return null;

        return {
            type: 'ERROR_HERE',
            title: 'Seu erro está aqui: Overtrading',
            description: `Nos dias com mais de ${p75} operações, seu resultado médio cai para R$ ${avgHighPnl.toFixed(0)}. Nos dias normais a média é R$ ${avgNormalPnl.toFixed(0)}.`,
            score: 90,
            sampleSize: trades.length,
            evidence: {
                threshold: p75,
                avgPnlAboveThreshold: avgHighPnl.toFixed(2),
                avgPnlBelowThreshold: avgNormalPnl.toFixed(2),
                overtradingDays: highDays.length,
            },
        };
    }

    private computeWorstTime(trades: { tradeDate: Date; pnl: number }[]) {
        const MIN_SAMPLE = 15;
        const buckets = new Map<string, number[]>();

        for (const t of trades) {
            const h = t.tradeDate.getUTCHours();
            const m = t.tradeDate.getUTCMinutes();
            const totalMins = h * 60 + m;
            const slot = Math.floor(totalMins / 30) * 30;
            const sh = Math.floor(slot / 60);
            const sm = slot % 60;
            const key = `${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`;
            const list = buckets.get(key) || [];
            list.push(Number(t.pnl));
            buckets.set(key, list);
        }

        let worstKey = '';
        let worstAvg = Infinity;

        for (const [key, pnls] of buckets) {
            if (pnls.length < MIN_SAMPLE) continue;
            const avg = pnls.reduce((s, v) => s + v, 0) / pnls.length;
            if (avg < worstAvg) {
                worstAvg = avg;
                worstKey = key;
            }
        }

        if (!worstKey || worstAvg >= 0) return null;

        const worstPnls = buckets.get(worstKey)!;

        return {
            type: 'WORST_TIME',
            title: 'Pior horário detectado',
            description: `O pior horário para operar é ${worstKey}–${this.addMinutes(worstKey, 30)} (EV negativo: R$ ${worstAvg.toFixed(0)}/op com ${worstPnls.length} operações).`,
            score: 80,
            sampleSize: worstPnls.length,
            evidence: {
                timeWindow: worstKey,
                avgPnl: worstAvg.toFixed(2),
                tradeCount: worstPnls.length,
            },
        };
    }

    private computeFocusSymbol(trades: { symbol: string; pnl: number }[]) {
        const bySymbol = new Map<string, number[]>();
        for (const t of trades) {
            const list = bySymbol.get(t.symbol) || [];
            list.push(Number(t.pnl));
            bySymbol.set(t.symbol, list);
        }

        let bestSymbol = '';
        let bestScore = -Infinity;

        for (const [sym, pnls] of bySymbol) {
            if (sym === 'OTHER' || pnls.length < 5) continue;
            const avg = pnls.reduce((s, v) => s + v, 0) / pnls.length;
            const std = Math.sqrt(
                pnls.reduce((s, v) => s + Math.pow(v - avg, 2), 0) / pnls.length,
            );
            const score = avg - std * 0.5; // balance between return and consistency
            if (score > bestScore) {
                bestScore = score;
                bestSymbol = sym;
            }
        }

        if (!bestSymbol) return null;

        const pnls = bySymbol.get(bestSymbol)!;
        const avg = pnls.reduce((s, v) => s + v, 0) / pnls.length;

        return {
            type: 'FOCUS_SYMBOL',
            title: `Foque no ${bestSymbol}`,
            description: `O ${bestSymbol} apresenta o melhor balanço entre retorno (R$ ${avg.toFixed(0)}/op) e consistência no seu histórico.`,
            score: 75,
            sampleSize: pnls.length,
            evidence: {
                symbol: bestSymbol,
                avgPnl: avg.toFixed(2),
                tradeCount: pnls.length,
            },
        };
    }

    private addMinutes(time: string, mins: number): string {
        const [h, m] = time.split(':').map(Number);
        const total = h * 60 + m + mins;
        return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
    }
}
