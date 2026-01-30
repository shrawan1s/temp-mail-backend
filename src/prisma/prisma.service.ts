import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LOG_MESSAGES } from '../common/constants';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;
  private readonly maxRetries = 5;
  private readonly retryDelay = 3000;

  async onModuleInit() {
    await this.connectWithRetry();
  }

  private async connectWithRetry(attempt = 1): Promise<void> {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log(LOG_MESSAGES.DB_CONNECTED);
    } catch (error) {
      const err = error as Error;
      this.logger.warn(
        LOG_MESSAGES.DB_CONNECTION_FAILED(
          attempt,
          this.maxRetries,
          err.message,
        ),
      );

      if (attempt < this.maxRetries) {
        this.logger.log(LOG_MESSAGES.DB_RETRY(this.retryDelay));
        await this.delay(this.retryDelay);
        return this.connectWithRetry(attempt + 1);
      }

      this.logger.error(LOG_MESSAGES.DB_MAX_RETRIES_FAILED);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  isDatabaseConnected(): boolean {
    return this.isConnected;
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
      this.logger.log(LOG_MESSAGES.DB_DISCONNECTED);
    }
  }
}
