import { Request, Response, NextFunction } from 'express';
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

  // app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  //   prefix: '/uploads/',
  // });

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
  prefix: '/uploads/',
  setHeaders: (res, path, stat) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); // ou ton domaine précis
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  },
});


  app.enableCors({
    origin: [
      'https://xibarubambouck-com-1z5y.vercel.app',
      'https://xibarubambouckadmin-c6sn.vercel.app',
      'https://bambouckadmin.vercel.app',
      'https://xibarubambouck.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Ajout CORS spécifique aux fichiers statiques
  app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
    res.header('Access-Control-Allow-Origin', 'https://xibarubambouck.com');
    res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`✅ Backend NestJS écoute sur http://localhost:${port}`);
}

bootstrap();
