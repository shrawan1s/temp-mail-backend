import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@temp-email/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private isConnected = false;
  private readonly maxRetries = 5;
  private readonly retryDelay = 3000; // 3 seconds

  async onModuleInit() {
    await this.connectWithRetry();
  }

  /**
   * Attempts to connect to the database with retry logic.
   * This handles the case where the database service might not be immediately available.
   */
  private async connectWithRetry(attempt = 1): Promise<void> {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Connected to PostgreSQL database');
    } catch (error) {
      this.logger.warn(
        `Database connection attempt ${attempt}/${this.maxRetries} failed: ${error.message}`,
      );

      if (attempt < this.maxRetries) {
        this.logger.log(`Retrying in ${this.retryDelay / 1000} seconds...`);
        await this.delay(this.retryDelay);
        return this.connectWithRetry(attempt + 1);
      }

      this.logger.error(
        'Failed to connect to database after maximum retries. Service will continue but database operations will fail.',
      );
      // Don't throw - let the service start and handle DB errors at runtime
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check if database is connected.
   * Useful for health checks.
   */
  isDatabaseConnected(): boolean {
    return this.isConnected;
  }

  async onModuleDestroy() {
    if (this.isConnected) {
      await this.$disconnect();
      this.logger.log('Disconnected from PostgreSQL database');
    }
  }
}

