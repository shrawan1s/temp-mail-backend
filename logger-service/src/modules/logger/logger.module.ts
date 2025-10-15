import { Module } from '@nestjs/common';
import { LogsController } from './logger.controller';
import { LoggerService } from './logger.service';
import { AlertService } from '../../workers/alert.service';
import { ResendAdapter } from '../../integrations/resend.adapter';

@Module({
    controllers: [LogsController],
    providers: [LoggerService, AlertService, ResendAdapter],
    exports: [LoggerService],
})
export class LoggerModule { }
