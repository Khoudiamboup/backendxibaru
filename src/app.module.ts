import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '3306', 10),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      entities: [User, Category, Article],
      synchronize: true,
    }),
    AuthModule,
    UserModule,
    CategoryModule, 
    ArticleModule,
    // ✅ Le module contient déjà le controller et service
  ],
  controllers: [AppController], // ✅ Supprimé CategoryController
  providers: [AppService, DatabaseService], // ✅ Supprimé CategoryService
})
export class AppModule {
  constructor(private readonly databaseService: DatabaseService) {
    this.databaseService.testConnection();
  }
}