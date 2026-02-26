import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';

@Injectable()
export class AccountsService {
    constructor(private prisma: PrismaService) { }

    async create(userId: string, dto: CreateAccountDto) {
        return this.prisma.account.create({
            data: {
                userId,
                ...dto,
            },
        });
    }

    async list(userId: string) {
        return this.prisma.account.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }

    async update(userId: string, id: string, dto: UpdateAccountDto) {
        const account = await this.prisma.account.findFirst({
            where: { id, userId },
        });

        if (!account) throw new NotFoundException('Account not found');

        return this.prisma.account.update({
            where: { id },
            data: dto,
        });
    }

    async remove(userId: string, id: string) {
        const account = await this.prisma.account.findFirst({
            where: { id, userId },
        });

        if (!account) throw new NotFoundException('Account not found');

        // Check if there are associated trades
        const tradeCount = await this.prisma.trade.count({ where: { accountId: id } });

        if (tradeCount > 0) {
            // Soft delete
            return this.prisma.account.update({
                where: { id },
                data: { isActive: false },
            });
        }

        return this.prisma.account.delete({
            where: { id },
        });
    }

    async findOrCreateByAccountNumber(userId: string, accountNumber: string) {
        let account = await this.prisma.account.findFirst({
            where: { userId, accountNumber },
        });

        if (!account) {
            account = await this.prisma.account.create({
                data: {
                    userId,
                    accountNumber,
                    name: `Conta ${accountNumber}`,
                    type: 'PERSONAL',
                },
            });
        }

        return account;
    }
}
