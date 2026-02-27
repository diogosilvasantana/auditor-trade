import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JournalService } from './journal.service';
import { CreateJournalDto } from './dto/journal.dto';

@Controller('journal')
@UseGuards(AuthGuard('jwt'))
export class JournalController {
    constructor(private journal: JournalService) { }

    @Post()
    create(@Request() req: any, @Body() dto: CreateJournalDto) {
        return this.journal.create(req.user.id, dto);
    }

    @Get()
    list(@Request() req: any, @Query() q: any) {
        return this.journal.list(req.user.id, q);
    }

    @Get(':date')
    getByDate(@Param('date') date: string, @Request() req: any, @Query('accountId') accountId?: string) {
        return this.journal.getByDate(req.user.id, date, accountId);
    }
}
