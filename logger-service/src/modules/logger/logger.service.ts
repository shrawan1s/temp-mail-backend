import { Injectable } from '@nestjs/common';
import { LogDTO } from '../../dto/log.dto';
import { logger } from '../../logger/logger.util';
import { AlertService } from '../../workers/alert.service';

@Injectable()
export class LoggerService {
    constructor(private readonly alertService: AlertService) { }

    async enqueue(dto: LogDTO): Promise<void> {
        // Log locally (console/pino)
        logger[dto.level]?.(dto.message, {
            service: dto.service,
            requestId: dto.requestId,
            meta: dto.meta,
            error: dto.error,
        });

        // Send to alert detector (non-blocking)
        void this.alertService.process(dto);
    }
}
