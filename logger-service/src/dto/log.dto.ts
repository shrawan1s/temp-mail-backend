import { IsString, IsOptional, IsEnum, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum LogLevel {
    TRACE = 'trace',
    DEBUG = 'debug',
    INFO = 'info',
    WARN = 'warn',
    ERROR = 'error',
    FATAL = 'fatal',
}

class LogErrorDTO {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    message?: string;

    @IsOptional()
    @IsString()
    stack?: string;
}

export class LogDTO {
    @IsOptional()
    @IsString()
    timestamp?: string;

    @IsEnum(LogLevel)
    level!: LogLevel;

    @IsOptional()
    @IsString()
    service?: string;

    @IsOptional()
    @IsString()
    env?: string;

    @IsOptional()
    @IsString()
    requestId?: string;

    @IsString()
    message!: string;

    @IsOptional()
    @IsObject()
    meta?: Record<string, any>;

    @IsOptional()
    @ValidateNested()
    @Type(() => LogErrorDTO)
    error?: LogErrorDTO;
}
