import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

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

        // Log the detected IP for debugging purposes
        // This will help identify if the load balancer IP is being used instead of client IP
        this.logger.debug(`Request from IP: ${clientIp}`);

        return clientIp;
    }

    /**
     * Override to provide better error message and log violations
     */
    protected async throwThrottlingException(
        context: ExecutionContext,
    ): Promise<void> {
        const req = context.switchToHttp().getRequest();
        const clientIp = req.ip || 'unknown';

        this.logger.warn(`Rate limit exceeded for IP: ${clientIp}`);

        throw new ThrottlerException('Too Many Requests');
    }
}
