import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { ProxyOptions } from 'http-proxy';

@Module({})
export class ProxyModule implements NestModule {
    constructor(private readonly configService: ConfigService) { }

    configure(consumer: MiddlewareConsumer) {
        const authServiceUrl = this.configService.get<string>('services.auth');
        const mailServiceUrl = this.configService.get<string>('services.mail');
        const loggerServiceUrl = this.configService.get<string>('services.logger');

        const createTracingProxy = (targetUrl: string) =>
            createProxyMiddleware({
                target: targetUrl,
                changeOrigin: true,
                pathRewrite: (path) => path.replace(/^\/(auth|mail|logger)/, ''),
                ...({
                    onProxyReq: (proxyReq, req: any) => {
                        if (req.headers['traceparent']) proxyReq.setHeader('traceparent', req.headers['traceparent']);
                        if (req.headers['newrelic']) proxyReq.setHeader('newrelic', req.headers['newrelic']);
                        const requestId = req.headers['x-request-id'] || uuidv4();
                        proxyReq.setHeader('x-request-id', requestId);
                    }
                } as ProxyOptions),
            });

        // Proxy routes with tracing
        consumer.apply(createTracingProxy(String(authServiceUrl))).forRoutes('/auth');
        consumer.apply(createTracingProxy(String(mailServiceUrl))).forRoutes('/mail');
        consumer.apply(createTracingProxy(String(loggerServiceUrl))).forRoutes('/logger');
    }
}
