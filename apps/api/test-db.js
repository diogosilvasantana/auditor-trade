const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasources: { db: { url: 'postgresql://auditor:auditor123@localhost:5432/auditor_trade?schema=public' } }
});

async function main() {
    const trades = await prisma.trade.findMany({ take: 5, orderBy: { tradeDate: 'desc' } });
    console.log(JSON.stringify(trades, null, 2));
}

main().finally(() => prisma.$disconnect());
