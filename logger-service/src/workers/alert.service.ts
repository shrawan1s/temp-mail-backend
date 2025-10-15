import { Injectable } from '@nestjs/common';
import { LogDTO } from '../dto/log.dto';
import { appConfig } from '../config/app.config';
import { ResendAdapter } from '../integrations/resend.adapter';
import { logger } from '../logger/logger.util';

@Injectable()
export class AlertService {
    private errorMap = new Map<string, number[]>();
    private cooldownMap = new Map<string, number>();
    private readonly threshold = appConfig.errorThreshold;
    private readonly windowMs = appConfig.errorTimeWindow;
    private readonly cooldownMs = 5 * 60 * 1000; // 5 min cooldown

    constructor(private readonly resend: ResendAdapter) { }

    private prune(arr: number[]): number[] {
        const now = Date.now();
        return arr.filter((t) => now - t <= this.windowMs);
    }

    private isOnCooldown(key: string) {
        const last = this.cooldownMap.get(key) || 0;
        return Date.now() - last < this.cooldownMs;
    }

    async process(dto: LogDTO) {
        try {
            if (!dto || !dto.level) return;
            if (!['error', 'fatal'].includes(dto.level)) return;

            const key = `${dto.service || 'unknown'}|${dto.level}`;
            const now = Date.now();

            const arr = this.prune(this.errorMap.get(key) || []);
            arr.push(now);
            this.errorMap.set(key, arr);

            if (arr.length >= this.threshold) {
                if (this.isOnCooldown(key)) {
                    logger.info('Alert suppressed due to cooldown', { key });
                    this.errorMap.set(key, []); // still reset
                    return;
                }

                // prepare alert props
                const props = {
                    service: dto.service || 'unknown',
                    level: dto.level,
                    occurrences: arr.length,
                    lastMessage: dto.message || '',
                };

                const subject = `⚠️ Alert: ${props.service} — ${props.occurrences} ${props.level} logs`;

                // send email (non-blocking)
                void this.resend.sendAlert(subject, props, key)
                    .then(() => {
                        this.cooldownMap.set(key, Date.now());
                        logger.info('Alert sent', { key, occurrences: props.occurrences });
                    })
                    .catch((err) => {
                        logger.error('Failed to send alert', { key, error: err?.message || err });
                    });

                this.errorMap.set(key, []); // reset after triggering
            }
        } catch (err: any) {
            logger.error('AlertService.process error', { error: err?.message || err });
        }
    }
}
