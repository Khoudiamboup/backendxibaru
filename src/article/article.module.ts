import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './article.entity';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { Category } from 'src/category/category.entity';
import { User } from 'src/user/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Article, Category, User])],
  providers: [ArticleService],
  controllers: [ArticleController],
})
export class ArticleModule {}
