import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { Metadata } from '@grpc/grpc-js';

/**
 * Interceptor that adds internal API key to all outgoing gRPC calls.
 * This is used for service-to-service authentication.
 */
@Injectable()
export class GrpcMetadataInterceptor implements NestInterceptor {
  private readonly internalApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.internalApiKey = this.configService.get<string>('app.internalApiKey', '');
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // This interceptor is applied at the service level, not modifying gRPC metadata directly
    // The metadata needs to be passed during gRPC client calls
    return next.handle();
  }

  /**
   * Create metadata with internal API key for gRPC calls.
   */
  createMetadata(): Metadata {
    const metadata = new Metadata();
    if (this.internalApiKey) {
      metadata.add('x-internal-key', this.internalApiKey);
    }
    return metadata;
  }
}
