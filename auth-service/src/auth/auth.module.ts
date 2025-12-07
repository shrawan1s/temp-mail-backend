import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { UserModule } from '../user';
import { TokenModule } from '../token';
import { OAuthModule } from '../oauth';
import { EmailModule } from '../email';

@Module({
  imports: [UserModule, TokenModule, OAuthModule, EmailModule],
  controllers: [AuthController],
})
export class AuthModule {}
