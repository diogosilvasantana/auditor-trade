import {
    Controller,
    Get,
    Post,
    Param,
    Body,
    Query,
    Put,
    Delete,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PropService } from './prop.service';
import { CreateChallengeDto } from './dto/challenge.dto';

@Controller('prop-challenges')
@UseGuards(AuthGuard('jwt'))
export class PropController {
    constructor(private prop: PropService) { }

    @Post()
    create(@Request() req: any, @Body() dto: CreateChallengeDto) {
        return this.prop.create(req.user.id, dto);
    }

    @Get()
    list(@Request() req: any) {
        return this.prop.list(req.user.id);
    }

    @Get(':id/plan')
    getPlan(@Param('id') id: string, @Request() req: any) {
        return this.prop.getPlan(req.user.id, id);
    }

    @Get(':id/progress')
    getProgress(
        @Param('id') id: string,
        @Request() req: any,
        @Query() q: any,
    ) {
        return this.prop.getProgress(req.user.id, id, q);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: Partial<CreateChallengeDto>,
    ) {
        return this.prop.update(req.user.id, id, dto);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @Request() req: any) {
        return this.prop.delete(req.user.id, id);
    }
}
