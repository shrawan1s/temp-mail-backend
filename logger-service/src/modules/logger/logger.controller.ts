import { Controller, Post, Body, HttpCode } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { LogDTO } from '../../dto/log.dto';

@Controller('logs')
export class LogsController {
    constructor(private readonly loggerService: LoggerService) { }

    @Post()
    @HttpCode(200)
    async receiveLog(@Body() dto: LogDTO) {
        // dto is already validated by ValidationPipe configured in main.ts
        // fire-and-forget enqueue/processing — returns quickly
        void this.loggerService.enqueue(dto);
        return { status: 'ok' };
    }
}
