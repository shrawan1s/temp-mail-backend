import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { IValidateTokenResponse } from '../interfaces';
import { ERROR_MESSAGES } from '../constants';
import { HttpMethod } from '../enums';
import { ENDPOINTS } from '../../config';

/**
 * JWT authentication guard that validates tokens via HTTP call to auth-service.
 * Checks for @Public() decorator to skip authentication on public routes.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly authServiceUrl: string;
  private readonly internalApiKey: string;

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
  ) {
    this.authServiceUrl = this.configService.get<string>('app.authServiceUrl') || '';
    this.internalApiKey = this.configService.get<string>('app.internalApiKey') || '';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH_TOKEN_REQUIRED);
    }

    try {
      const response = await this.validateToken(token);

      if (!response.valid) {
        throw new UnauthorizedException(ERROR_MESSAGES.AUTH_TOKEN_INVALID);
      }

      // Attach user info to request
      request.user = {
        userId: response.user_id,
        email: response.email,
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(ERROR_MESSAGES.AUTH_TOKEN_VALIDATION_FAILED);
    }
  }

  /**
   * Validate access token by calling auth-service.
   */
  private async validateToken(accessToken: string): Promise<IValidateTokenResponse> {
    const url = `${this.authServiceUrl}${ENDPOINTS.auth.validateToken}`;

    const response = await fetch(url, {
      method: HttpMethod.POST,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': this.internalApiKey,
      },
      body: JSON.stringify({ access_token: accessToken }),
    });

    if (!response.ok) {
      return { valid: false };
    }

    return response.json();
  }

  /**
   * Extract Bearer token from Authorization header.
   */
  private extractTokenFromHeader(request: { headers: { authorization?: string } }): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
