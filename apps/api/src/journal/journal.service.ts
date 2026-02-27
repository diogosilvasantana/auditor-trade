import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateJournalDto } from './dto/journal.dto';

@Injectable()
export class JournalService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, dto: CreateJournalDto) {
        const date = new Date(dto.date);

        return this.prisma.journalEntry.upsert({
            where: { userId_date: { userId, date } },
            update: {
                emotion: dto.emotion as any,
                followedPlan: dto.followedPlan as any,
                triggers: dto.triggers ?? [],
                notes: dto.notes,
            },
            create: {
                userId,
                date,
                emotion: dto.emotion as any,
                followedPlan: dto.followedPlan as any,
                triggers: dto.triggers ?? [],
                notes: dto.notes,
            },
        });
    }

    async list(userId: string, q: { start?: string; end?: string }) {
        const gte = q.start ? new Date(q.start) : undefined;
        const lte = q.end ? new Date(q.end) : undefined;

        return this.prisma.journalEntry.findMany({
            where: { userId, date: { gte, lte } },
            orderBy: { date: 'desc' },
        });
    }

    async getByDate(userId: string, date: string, accountId?: string) {
        const dateObj = new Date(date);

        const entry = await this.prisma.journalEntry.findUnique({
            where: { userId_date: { userId, date: dateObj } },
        });

        // Get trading context for this date (aggregate all accounts)
        const stats = await this.prisma.dailyStat.findMany({
            where: {
                userId,
                date: dateObj,
                ...(accountId ? { accountId } : {})
            },
        });

        const context = stats.length > 0 ? stats.reduce((acc, curr) => ({
            pnl: acc.pnl + Number(curr.totalPnl),
            trades: acc.trades + curr.totalTrades,
            wins: acc.wins + curr.wins,
            losses: acc.losses + curr.losses
        }), { pnl: 0, trades: 0, wins: 0, losses: 0 }) : null;

        return {
            entry,
            context,
        };
    }
}
