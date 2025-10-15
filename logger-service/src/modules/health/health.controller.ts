import { Controller, Get } from '@nestjs/common';
import { logger } from '../../logger/logger.util';
import { appConfig } from '../../config/app.config';

@Controller('health')
export class HealthController {
    @Get()
    async getHealth() {
        logger.info('Health check OK');
        return {
            status: 'OK',
            uptime: process.uptime(),
            service: appConfig.serviceName,
            timestamp: new Date().toISOString(),
        };
    }
}
