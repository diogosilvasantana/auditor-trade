import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InsightsService } from './insights.service';

@Controller('insights')
@UseGuards(AuthGuard('jwt'))
export class InsightsController {
    constructor(private insights: InsightsService) { }

    @Get()
    get(@Request() req: any, @Query() q: any) {
        return this.insights.getInsights(req.user.id, q);
    }
}
