import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const userCount = await prisma.user.count();
    console.log(`User count: ${userCount}`);

    if (userCount > 0) {
        const users = await prisma.user.findMany({
            select: { id: true, email: true }
        });
        console.log('Users in DB:');
        console.log(JSON.stringify(users, null, 2));
    } else {
        console.log('No users found in database.');
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
