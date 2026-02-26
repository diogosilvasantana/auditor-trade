const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const trades = await prisma.trade.findMany({
        orderBy: { tradeDate: 'desc' },
        take: 2
    });
    console.log("LAST 2 TRADES IN DATABASE:");
    console.log(JSON.stringify(trades, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
