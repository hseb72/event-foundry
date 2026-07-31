import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { StructuredLogger } from '@event-foundry/libraries';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(new StructuredLogger('backend'));
  const config = app.get(ConfigService);

  const apiPrefix = config.get<string>('API_PREFIX', '/api/v1');
  app.setGlobalPrefix(apiPrefix.replace(/^\//, ''));

  // Validation systématique des entrées (TSPEC.07).
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  // Plusieurs origines autorisées (liste séparée par des virgules). En dev, localhost et
  // 127.0.0.1 sont des origines distinctes pour le navigateur.
  const corsOrigins = config
    .get<string>('CORS_ORIGIN', 'http://localhost:4200,http://127.0.0.1:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: corsOrigins, credentials: true });

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
