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

    async getByDate(userId: string, date: string) {
        const dateObj = new Date(date);

        const entry = await this.prisma.journalEntry.findUnique({
            where: { userId_date: { userId, date: dateObj } },
        });

        // Get trading context for this date
        const stat = await this.prisma.dailyStat.findUnique({
            where: { userId_date: { userId, date: dateObj } },
        });

        return {
            entry,
            context: stat
                ? {
                    pnl: Number(stat.totalPnl),
                    trades: stat.totalTrades,
                    wins: stat.wins,
                    losses: stat.losses,
                }
                : null,
        };
    }
}
