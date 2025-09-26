import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';

import { HealthController } from './health.controller';
import { HealthService } from './health.service';

@Module({
  imports: [
    CacheModule.register({
      ttl: 300000, // 5 minutes
      max: 1000,
    }),
  ],
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
