import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UserModule } from '../user';
import { TokenModule } from '../token';
import { OAuthModule } from '../oauth';

@Module({
  imports: [UserModule, TokenModule, OAuthModule],
  controllers: [AuthController],
})
export class AuthModule {}
