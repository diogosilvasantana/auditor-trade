import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AccountsService } from './accounts.service';
import { CreateAccountDto, UpdateAccountDto } from './dto/account.dto';

@Controller('accounts')
@UseGuards(AuthGuard('jwt'))
export class AccountsController {
    constructor(private accountsService: AccountsService) { }

    @Post()
    create(@Request() req: any, @Body() dto: CreateAccountDto) {
        return this.accountsService.create(req.user.id, dto);
    }

    @Get()
    list(@Request() req: any) {
        return this.accountsService.list(req.user.id);
    }

    @Put(':id')
    update(
        @Param('id') id: string,
        @Request() req: any,
        @Body() dto: UpdateAccountDto,
    ) {
        return this.accountsService.update(req.user.id, id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string, @Request() req: any) {
        return this.accountsService.remove(req.user.id, id);
    }
}
