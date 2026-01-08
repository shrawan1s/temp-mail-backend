import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Guard to validate internal API key for service-to-service communication.
 * Checks the 'x-internal-api-key' header against configured secret.
 */
@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-internal-api-key'];
    const validKey = this.configService.get<string>('app.internalApiKey');

    if (!validKey) {
      // If no key configured, allow (development mode)
      return true;
    }

    if (!apiKey || apiKey !== validKey) {
      throw new UnauthorizedException('Invalid internal API key');
    }

    return true;
  }
}
