export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogError {
    name?: string;
    message?: string;
    stack?: string;
}

export interface LogPayload {
    timestamp?: string;
    level: LogLevel;
    service?: string;
    env?: string;
    requestId?: string;
    message: string;
    meta?: Record<string, any>;
    error?: LogError;
}
