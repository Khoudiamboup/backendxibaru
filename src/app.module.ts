
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path'; 

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DatabaseService } from './database/database.service';
import { UserModule } from './user/user.module';
import { User } from './user/user.entity';
import { CategoryModule } from './category/category.module';
import { Category } from './category/category.entity';
import { Article } from './article/article.entity';
import { ArticleModule } from './article/article.module';
import { MediaModule } from './media/media.module';
import { MediaMeta } from './media/media.entity';
import { ServeStaticModule } from '@nestjs/serve-static';
import { DebugController } from './debug.controller';
import { CommentModule } from './comment/comment.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
  ServeStaticModule.forRoot({
  rootPath: join(__dirname, '..', 'uploads'),
  serveRoot: '/uploads',
  serveStaticOptions: {
    index: false,
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  },
}),

    
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [__dirname + '/**/*.entity.{js,ts}'],  
      synchronize: true,
    }),
    
    AuthModule,
    UserModule,
    CategoryModule,
    ArticleModule,
    MediaModule,
    CommentModule,
  ],
  controllers: [AppController,DebugController],
  providers: [AppService, DatabaseService],
})
export class AppModule {
  constructor(private readonly databaseService: DatabaseService) {
    this.databaseService.testConnection();
    
    console.log('🔗 Images disponibles à: http://localhost:3001/uploads/...');
  }
}