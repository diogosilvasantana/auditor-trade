import { Module } from '@nestjs/common';
import { PropService } from './prop.service';
import { PropController } from './prop.controller';

@Module({
    providers: [PropService],
    controllers: [PropController],
})
export class PropModule { }
