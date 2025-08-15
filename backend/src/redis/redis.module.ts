import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisModule as IoRedisModule } from '@nestjs-modules/ioredis';
import { RedisService } from './redis.service';
import redisConfig from '../config/redis.config';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(redisConfig),
    IoRedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get('redis.url');
        
        if (redisUrl) {
          // Use Redis Cloud URL
          return {
            type: 'single',
            url: redisUrl,
            options: {
              retryDelayOnFailover: configService.get('redis.retryDelayOnFailover'),
              enableReadyCheck: configService.get('redis.enableReadyCheck'),
              maxRetriesPerRequest: configService.get('redis.maxRetriesPerRequest'),
              lazyConnect: true,
              keepAlive: 30000,
              connectTimeout: 60000,
              commandTimeout: 5000,
            },
          };
        } else {
          // Use individual host/port/password configuration
          return {
            type: 'single',
            url: `redis://${configService.get('redis.host')}:${configService.get('redis.port')}`,
            options: {
              password: configService.get('redis.password'),
              db: configService.get('redis.db'),
              retryDelayOnFailover: configService.get('redis.retryDelayOnFailover'),
              enableReadyCheck: configService.get('redis.enableReadyCheck'),
              maxRetriesPerRequest: configService.get('redis.maxRetriesPerRequest'),
            },
          };
        }
      },
      inject: [ConfigService],
    }),
  ],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
