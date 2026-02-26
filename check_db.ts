import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
    console.log('--- DATABASE DIAGNOSIS ---');
    const users = await prisma.user.findMany();
    if (users.length === 0) {
        console.log('No users found.');
        return;
    }

    for (const user of users) {
        console.log(`\nUser: ${user.email} (${user.id})`);

        const accounts = await prisma.account.findMany({ where: { userId: user.id } });
        console.log(`Accounts: ${accounts.length}`);
        accounts.forEach(a => console.log(`  - ${a.name} (${a.type}, accountNumber: ${a.accountNumber}) ID: ${a.id}`));

        const trades = await prisma.trade.findMany({ where: { userId: user.id } });
        console.log(`Total Trades: ${trades.length}`);
        const unassigned = trades.filter(t => !t.accountId).length;
        console.log(`  - Unassigned trades (no accountId): ${unassigned}`);

        const byAccount = new Map<string, number>();
        trades.forEach(t => {
            if (t.accountId) {
                byAccount.set(t.accountId, (byAccount.get(t.accountId) || 0) + 1);
            }
        });
        byAccount.forEach((count, id) => {
            const name = accounts.find(a => a.id === id)?.name || id;
            console.log(`  - Account "${name}": ${count} trades`);
        });

        const stats = await prisma.dailyStat.findMany({ where: { userId: user.id } });
        console.log(`DailyStats: ${stats.length}`);
        const statsByAccount = new Map<string, number>();
        stats.forEach(s => {
            const key = s.accountId || 'null';
            statsByAccount.set(key, (statsByAccount.get(key) || 0) + 1);
        });
        statsByAccount.forEach((count, key) => console.log(`  - Account ${key}: ${count} stats`));
    }
}

check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
