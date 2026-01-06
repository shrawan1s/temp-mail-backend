import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GrpcClientService } from './grpc-client.service';

/**
 * Global module providing gRPC client utilities.
 * Makes GrpcClientService available across all gateway modules.
 */
@Global()
@Module({
    imports: [ConfigModule],
    providers: [GrpcClientService],
    exports: [GrpcClientService],
})
export class GrpcModule { }
