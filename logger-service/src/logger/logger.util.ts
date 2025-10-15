import pino from 'pino';
import { appConfig } from '../config/app.config';
import { LogPayload } from '../schema/logger.schema';

const baseLogger = pino({
    level: appConfig.logLevel,
    transport: appConfig.isDev
        ? { target: 'pino-pretty', options: { colorize: true, translateTime: true } }
        : undefined,
});

type Level = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

function safeLog(level: Level, msg: string, meta?: Record<string, any>) {
    // pino call
    (baseLogger as any)[level](meta || {}, msg);
}

export const logger = {
    trace: (msg: string, meta?: Record<string, any>) => safeLog('trace', msg, meta),
    debug: (msg: string, meta?: Record<string, any>) => safeLog('debug', msg, meta),
    info: (msg: string, meta?: Record<string, any>) => safeLog('info', msg, meta),
    warn: (msg: string, meta?: Record<string, any>) => safeLog('warn', msg, meta),
    error: (msg: string, meta?: Record<string, any>) => safeLog('error', msg, meta),
    fatal: (msg: string, meta?: Record<string, any>) => safeLog('fatal', msg, meta),
    raw: baseLogger,
};

// export compatible type for DTO usage
export type { LogPayload };
