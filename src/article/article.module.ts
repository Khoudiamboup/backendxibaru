import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Article } from './article.entity';
import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';
import { User } from 'src/user/user.entity';
import { MediaService } from 'src/media/media.service';
import { MediaMeta } from 'src/media/media.entity';
import { CategoryService } from 'src/category/category.service';
import { Category } from 'src/category/category.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Article, User, MediaMeta, Category])],
  providers: [ArticleService,MediaService,CategoryService],
  controllers: [ArticleController],
})
export class ArticleModule {}
