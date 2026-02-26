import {
    Controller,
    Post,
    Get,
    Delete,
    Param,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { ImportsService } from './imports.service';

@Controller('imports')
@UseGuards(AuthGuard('jwt'))
export class ImportsController {
    constructor(private imports: ImportsService) { }

    @Post()
    @UseInterceptors(
        FileInterceptor('file', {
            limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
        }),
    )
    upload(
        @UploadedFile() file: Express.Multer.File,
        @Request() req: any,
    ) {
        if (!file) throw new BadRequestException('No file uploaded');
        return this.imports.createImport(req.user.id, file);
    }

    @Get()
    list(@Request() req: any) {
        return this.imports.listImports(req.user.id);
    }

    @Get(':id')
    get(@Param('id') id: string, @Request() req: any) {
        return this.imports.getImport(req.user.id, id);
    }

    @Delete(':id')
    delete(@Param('id') id: string, @Request() req: any) {
        return this.imports.deleteImport(req.user.id, id);
    }
}
