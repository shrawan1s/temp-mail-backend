import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerException } from '@nestjs/throttler';

/**
 * Custom throttler guard that extracts the real client IP from proxy headers.
 * Render (and other reverse proxies) forward requests, so we need to check
 * X-Forwarded-For header to get the actual client IP for proper rate limiting.
 */
@Injectable()
export class ProxyAwareThrottlerGuard extends ThrottlerGuard {
    /**
     * Extract the real client IP from X-Forwarded-For header.
     * Falls back to regular IP if header is not present.
     */
    protected async getTracker(req: Record<string, any>): Promise<string> {
        // X-Forwarded-For format: "client, proxy1, proxy2, ..."
        const forwardedFor = req.headers['x-forwarded-for'];

        if (forwardedFor) {
            // Get the first (original client) IP
            const clientIp = Array.isArray(forwardedFor)
                ? forwardedFor[0]
                : forwardedFor.split(',')[0].trim();
            return clientIp;
        }

        // Fallback to direct connection IP
        return req.ip || req.connection?.remoteAddress || 'unknown';
    }

    /**
     * Override to provide better error message
     */
    protected async throwThrottlingException(
        context: ExecutionContext,
    ): Promise<void> {
        throw new ThrottlerException('Too Many Requests');
    }
}
