const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const imp = await prisma.import.findFirst({ orderBy: { createdAt: 'desc' } });
    console.log("LAST IMPORT:", imp);
    const count = await prisma.trade.count({ where: { importId: imp.id } });
    console.log("TRADES BELONGING TO IMPORT:", count);

    const sample = await prisma.trade.findMany({
        where: { importId: imp.id },
        take: 3,
        select: { tradeDate: true, symbol: true, pnl: true, quantity: true }
    });
    console.log("SAMPLE:");
    console.dir(sample, { depth: null });
}

main().catch(console.error).finally(() => prisma.$disconnect());
