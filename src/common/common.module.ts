import { Global, Module } from '@nestjs/common';

import { LoggerService } from './services/logger.service';
import { MetricsService } from './services/metrics.service';
import { PerformanceService } from './services/performance.service';
import { QueryOptimizationService } from './services/query-optimization.service';

@Global()
@Module({
  providers: [
    LoggerService,
    MetricsService,
    QueryOptimizationService,
    PerformanceService,
  ],
  exports: [
    LoggerService,
    MetricsService,
    QueryOptimizationService,
    PerformanceService,
  ],
})
export class CommonModule {}
