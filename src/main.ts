import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { CompressionInterceptor } from './common/interceptors/compression.interceptor';
import { SerializerInterceptor } from './common/interceptors/serializer.interceptor';
import validationOptions from './common/pipes/validation-options.pipe';
import { LoggerService } from './common/services/logger.service';
import { MetricsService } from './common/services/metrics.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    logger: new LoggerService(),
  });
  const configService = app.get(ConfigService);
  const logger = app.get(LoggerService);
  const metricsService = app.get(MetricsService);

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );
  app.use(compression());

  app.enableShutdownHooks();
  app.setGlobalPrefix(configService.get('app.apiPrefix') ?? 'api', {
    exclude: ['/', '/health', '/health/ready', '/health/live'],
  });
  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalFilters(new AllExceptionsFilter(logger, metricsService));
  app.useGlobalInterceptors(
    new SerializerInterceptor(),
    new CompressionInterceptor(),
  );
  app.useGlobalPipes(new ValidationPipe(validationOptions));

  const options = new DocumentBuilder()
    .setTitle('Contacts Management API')
    .setDescription(
      'Contact Manager API provides developers with a robust set of endpoints to manage contacts efficiently within their applications. It allows users to create, retrieve, update, and delete contacts, as well as perform various operations such as searching, sorting, and filtering.',
    )
    .setVersion('1.0')
    .setContact('Isah Ohieku', 'https://isahohieku.com', 'isahohieku@gmail.com')
    .addServer('http://localhost:3000')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('docs', app, document);

  await app.listen(configService.get('app.port') ?? 3000);
}
bootstrap();
