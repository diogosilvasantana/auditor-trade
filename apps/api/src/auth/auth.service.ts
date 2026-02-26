import {
    Injectable,
    ConflictException,
    UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwt: JwtService,
    ) { }

    async register(dto: RegisterDto) {
        const exists = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (exists) throw new ConflictException('Email already registered');

        const passwordHash = await bcrypt.hash(dto.password, 12);

        const user = await this.prisma.user.create({
            data: { email: dto.email, passwordHash },
            select: { id: true, email: true, createdAt: true },
        });

        return user;
    }

    async login(dto: LoginDto) {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user) throw new UnauthorizedException('Invalid credentials');

        const valid = await bcrypt.compare(dto.password, user.passwordHash);
        if (!valid) throw new UnauthorizedException('Invalid credentials');

        const token = await this.jwt.signAsync(
            { sub: user.id, email: user.email },
            { expiresIn: '7d' },
        );

        return { token, user: { id: user.id, email: user.email } };
    }

    async getMe(userId: string) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, email: true, timezone: true, createdAt: true },
        });
        return user;
    }
}
