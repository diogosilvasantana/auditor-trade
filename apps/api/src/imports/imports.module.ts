import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ImportsService } from './imports.service';
import { ImportsController } from './imports.controller';
import { AccountsModule } from '../accounts/accounts.module';

@Module({
    imports: [
        MulterModule.register({ storage: memoryStorage() }),
        AccountsModule,
    ],
    providers: [ImportsService],
    controllers: [ImportsController],
})
export class ImportsModule { }
