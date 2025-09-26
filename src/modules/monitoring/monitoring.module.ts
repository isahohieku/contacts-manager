import { Module } from '@nestjs/common';

import { LoggerService } from '../../common/services/logger.service';
import { MetricsService } from '../../common/services/metrics.service';

import { MonitoringController } from './monitoring.controller';

@Module({
  controllers: [MonitoringController],
  providers: [MetricsService, LoggerService],
  exports: [MetricsService],
})
export class MonitoringModule {}
