import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { join } from 'path';
import { credentials } from '@grpc/grpc-js';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: 'AUTH_PACKAGE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => {
          const isProduction = configService.get('app.nodeEnv') === 'production';
          return {
            transport: Transport.GRPC,
            options: {
              package: 'auth',
              protoPath: join(__dirname, '../../proto/auth.proto'),
              url: configService.get<string>('app.authServiceUrl'),
              // Use SSL for production (public URLs), insecure for local development
              credentials: isProduction
                ? credentials.createSsl()
                : credentials.createInsecure(),
              loader: {
                keepCase: true,
                longs: String,
                enums: String,
                defaults: true,
                oneofs: true,
              },
            },
          };
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [ClientsModule],
})
export class AuthModule {}
