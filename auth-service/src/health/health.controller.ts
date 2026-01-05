import { Controller, Get } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { PrismaService } from '../prisma';

/**
 * Health check controller for auth-service.
 * Provides both gRPC and HTTP health endpoints for monitoring and keep-alive.
 */
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  /**
   * HTTP GET /health - Basic health check.
   * Used for deployment keep-alive pings.
   */
  @Get()
  async check() {
    return {
      status: 'ok',
      service: 'auth-service',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * HTTP GET /health/ready - Readiness check.
   * Verifies database connectivity.
   */
  @Get('ready')
  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch {
      return {
        status: 'not_ready',
        database: 'disconnected',
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * HTTP GET /health/live - Liveness check.
   * Basic alive check for orchestrators.
   */
  @Get('live')
  live() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * gRPC Health check method.
   * Can be called by gateway to verify service is running.
   */
  @GrpcMethod('AuthService', 'HealthCheck')
  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ok',
        service: 'auth-service',
        database: 'connected',
      };
    } catch {
      return {
        status: 'degraded',
        service: 'auth-service',
        database: 'disconnected',
      };
    }
  }
}
