import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { ArticleService } from './article.service';
import { Article } from './article.entity';

@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  @Get()
  findAll(): Promise<Article[]> {
    return this.articleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: number): Promise<Article> {
    return this.articleService.findOne(+id);
  }

  @Post()
  create(@Body() articleData: Partial<Article>): Promise<Article> {
    return this.articleService.create(articleData);
  }

  @Put(':id')
  update(@Param('id') id: number, @Body() articleData: Partial<Article>): Promise<Article> {
    return this.articleService.update(+id, articleData);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.articleService.remove(+id);
  }
}
