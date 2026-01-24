import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';
import { LOG_MESSAGES } from '../constants/messages';

/**
 * Custom throttler guard that relies on 'trust proxy' setting for IP detection
 * and adds logging for debugging.
 */
@Injectable()
export class ProxyAwareThrottlerGuard extends ThrottlerGuard {
    private readonly logger = new Logger(ProxyAwareThrottlerGuard.name);

    /**
     * Get the tracker for the current request (Client IP).
     * Relies on Express 'trust proxy' setting to populate req.ip correctly.
     */
    protected async getTracker(req: Record<string, any>): Promise<string> {
        const clientIp = req.ip || 'unknown';
        const forwardedFor = req.headers?.['x-forwarded-for'] || 'none';

        // Log every 10th request to avoid log spam
        this.requestCount = (this.requestCount || 0) + 1;
        if (this.requestCount === 1 || this.requestCount % 10 === 0) {
            this.logger.log(LOG_MESSAGES.IP_DETECTION(this.requestCount, clientIp, forwardedFor));
        }

        return clientIp;
    }

    private requestCount = 0;

    /**
     * Override to provide better error message and log violations
     */
    protected async throwThrottlingException(
        context: ExecutionContext,
    ): Promise<void> {
        const req = context.switchToHttp().getRequest();
        const clientIp = req.ip || 'unknown';

        this.logger.warn(LOG_MESSAGES.RATE_LIMIT_EXCEEDED(clientIp));

        throw new ThrottlerException('Too Many Requests');
    }
}
