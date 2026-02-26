import {
    Controller,
    Get,
    Post,
    Put,
    Param,
    Body,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/plan.dto';

@Controller('plans')
@UseGuards(AuthGuard('jwt'))
export class PlansController {
    constructor(private plans: PlansService) { }

    @Get('active')
    getActive(@Request() req: any) {
        return this.plans.getActive(req.user.id);
    }

    @Post()
    create(@Request() req: any, @Body() dto: CreatePlanDto) {
        return this.plans.create(req.user.id, dto);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: Partial<CreatePlanDto>,
    ) {
        return this.plans.update(req.user.id, id, dto);
    }

    @Get('violations')
    violations(@Request() req: any, @Query() q: any) {
        return this.plans.getViolations(req.user.id, q);
    }
}
