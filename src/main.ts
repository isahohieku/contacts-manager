import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { SerializerInterceptor } from './common/interceptors/serializer.interceptor';
import validationOptions from './common/pipes/validation-options.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableShutdownHooks();
  app.setGlobalPrefix(configService.get('app.apiPrefix'), {
    exclude: ['/'],
  });
  app.enableVersioning({
    type: VersioningType.URI,
  });

  app.useGlobalInterceptors(new SerializerInterceptor());
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

  await app.listen(configService.get('app.port'));
}
bootstrap();
