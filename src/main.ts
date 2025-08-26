
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(express.json({ limit: '50mb' })); 
  app.use(express.urlencoded({ limit: '50mb', extended: true })); 
  app.useGlobalPipes(new ValidationPipe({
    transform: true,           
    whitelist: true,          
    forbidNonWhitelisted: true, 
    skipMissingProperties: false, 
  }));

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  app.enableCors({
    origin: 'https://xibarubambouck-com-1z5y.vercel.app', 
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'], 
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend NestJS écoute sur http://localhost:${port}`);
}
bootstrap();