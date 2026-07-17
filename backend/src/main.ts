import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  const apiPrefix = config.get<string>('API_PREFIX', '/api/v1');
  app.setGlobalPrefix(apiPrefix.replace(/^\//, ''));

  // Validation systématique des entrées (TSPEC.07).
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  app.enableCors({ origin: config.get<string>('CORS_ORIGIN', 'http://localhost:4200') });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('EventFoundry API')
    .setDescription('API REST EventFoundry (V1).')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = config.get<number>('API_PORT', 3000);
  await app.listen(port);
}

void bootstrap();
