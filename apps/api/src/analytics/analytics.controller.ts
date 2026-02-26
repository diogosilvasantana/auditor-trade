import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
    constructor(private analytics: AnalyticsService) { }

    @Get('overview')
    overview(@Request() req: any, @Query() q: any) {
        return this.analytics.getOverview(req.user.id, q);
    }

    @Get('by-symbol')
    bySymbol(@Request() req: any, @Query() q: any) {
        return this.analytics.getBySymbol(req.user.id, q);
    }

    @Get('heatmap')
    heatmap(@Request() req: any, @Query() q: any) {
        return this.analytics.getHeatmap(req.user.id, q);
    }

    @Get('by-weekday')
    byWeekday(@Request() req: any, @Query() q: any) {
        return this.analytics.getByWeekday(req.user.id, q);
    }

    @Get('trades')
    trades(@Request() req: any, @Query() q: any) {
        return this.analytics.getTrades(req.user.id, q);
    }
}
