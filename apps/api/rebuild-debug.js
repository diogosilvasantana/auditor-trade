const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function rebuildDailyStats() {
    console.log("Starting Rebuild...");
    const trades = await prisma.trade.findMany({ select: { userId: true, tradeDate: true, pnl: true } });
    console.log(`Found ${trades.length} raw trades in DB.`);

    if (trades.length === 0) return;

    const userId = trades[0].userId;
    const byDate = new Map();

    for (const t of trades) {
        const key = t.tradeDate.toISOString().split('T')[0];
        const existing = byDate.get(key) || {
            totalPnl: 0,
            totalTrades: 0,
            wins: 0,
            losses: 0,
        };
        const pnl = Number(t.pnl);
        byDate.set(key, {
            totalPnl: existing.totalPnl + pnl,
            totalTrades: existing.totalTrades + 1,
            wins: existing.wins + (pnl > 0 ? 1 : 0),
            losses: existing.losses + (pnl < 0 ? 1 : 0),
        });
    }

    console.log(`Aggregated into ${byDate.size} daily groups. Running upserts...`);

    for (const [dateStr, stats] of byDate) {
        console.log(`Upserting ${dateStr}...`, stats);
        await prisma.dailyStat.upsert({
            where: { userId_date: { userId, date: new Date(dateStr) } },
            update: stats,
            create: { userId, date: new Date(dateStr), ...stats },
        });
    }

    console.log("Done rebuild!");
}

rebuildDailyStats().catch(console.error).finally(() => prisma.$disconnect());
