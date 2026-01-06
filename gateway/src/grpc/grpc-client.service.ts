import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Metadata } from '@grpc/grpc-js';

/**
 * Service to create gRPC metadata with internal API key.
 * Used by all gateway services to authenticate with backend microservices.
 */
@Injectable()
export class GrpcClientService {
  private readonly internalApiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.internalApiKey = this.configService.get<string>('app.internalApiKey', '');
  }

  /**
   * Create metadata with internal API key for gRPC calls.
   * @returns Metadata object to pass to gRPC service methods
   */
  getMetadata(): Metadata {
    const metadata = new Metadata();
    if (this.internalApiKey) {
      metadata.add('x-internal-key', this.internalApiKey);
    }
    return metadata;
  }
}
