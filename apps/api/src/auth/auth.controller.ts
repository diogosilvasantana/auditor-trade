import {
    Controller,
    Post,
    Get,
    Body,
    Res,
    UseGuards,
    Request,
    HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
    constructor(private auth: AuthService) { }

    @Post('register')
    async register(@Body() dto: RegisterDto) {
        return this.auth.register(dto);
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
        const result = await this.auth.login(dto);

        res.cookie('access_token', result.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        return { user: result.user };
    }

    @Post('logout')
    @HttpCode(200)
    logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('access_token');
        return { message: 'Logged out' };
    }

    @Get('me')
    @UseGuards(AuthGuard('jwt'))
    getMe(@Request() req: any) {
        return this.auth.getMe(req.user.id);
    }
}
