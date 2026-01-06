import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Guard to validate internal API key for inter-service gRPC calls.
 * Ensures only the Gateway (with the correct key) can call this service.
 */
@Injectable()
export class InternalKeyGuard implements CanActivate {
  private readonly logger = new Logger(InternalKeyGuard.name);
  private readonly internalApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.internalApiKey = this.configService.get<string>('app.internalApiKey', '');
  }

  canActivate(context: ExecutionContext): boolean {
    // Skip validation if no key is configured (development mode)
    if (!this.internalApiKey) {
      return true;
    }

    const type = context.getType();
    let providedKey: string | undefined;

    if (type === 'rpc') {
      // gRPC context - get metadata
      const rpcContext = context.switchToRpc();
      const metadata = rpcContext.getContext();
      providedKey = metadata?.get?.('x-internal-key')?.[0];
    } else {
      // HTTP context (fallback)
      const request = context.switchToHttp().getRequest();
      providedKey = request?.headers?.['x-internal-key'];
    }

    if (!providedKey || providedKey !== this.internalApiKey) {
      this.logger.warn('Invalid or missing internal API key');
      throw new UnauthorizedException('Invalid internal API key');
    }

    return true;
  }
}
