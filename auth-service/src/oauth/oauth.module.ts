import { Module } from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { UserModule } from '../user';

@Module({
  imports: [UserModule],
  providers: [OAuthService],
  exports: [OAuthService],
})
export class OAuthModule {}
