const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const count = await prisma.trade.count();
    const sample = await prisma.trade.findMany({ take: 3, select: { id: true, tradeDate: true, pnl: true, symbol: true } });
    console.log(`TOTAL TRADES IN DB: ${count}`);
    console.log("SAMPLE:");
    console.dir(sample, { depth: null });
    const importsCount = await prisma.import.count();
    console.log(`TOTAL IMPORTS IN DB: ${importsCount}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
