import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ConfigService } from '@nestjs/config';

@Module({})
export class ProxyModule implements NestModule {
    constructor(private readonly configService: ConfigService) { }

    configure(consumer: MiddlewareConsumer) {
        const authServiceUrl = this.configService.get<string>('services.auth');
        const mailServiceUrl = this.configService.get<string>('services.mail');
        const loggerServiceUrl = this.configService.get<string>('services.logger');

        consumer
            .apply(
                createProxyMiddleware({
                    target: authServiceUrl,
                    changeOrigin: true,
                    pathRewrite: { '^/auth': '' },
                }),
            )
            .forRoutes('/auth');

        consumer
            .apply(
                createProxyMiddleware({
                    target: mailServiceUrl,
                    changeOrigin: true,
                    pathRewrite: { '^/mail': '' },
                }),
            )
            .forRoutes('/mail');

        consumer
            .apply(
                createProxyMiddleware({
                    target: loggerServiceUrl,
                    changeOrigin: true,
                    pathRewrite: { '^/logger': '' },
                }),
            )
            .forRoutes('/logger');
    }
}
