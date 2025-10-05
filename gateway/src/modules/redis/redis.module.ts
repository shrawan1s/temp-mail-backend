import { Module, Global } from '@nestjs/common';
import { redisProvider } from '../../config/redis.config';

@Global()
@Module({
    providers: [redisProvider],
    exports: [redisProvider],
})
export class RedisModule { }
