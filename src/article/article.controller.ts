
import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ArticleService } from './article.service';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { CategoryService } from 'src/category/category.service';


@Controller('articles')
export class ArticleController {
  constructor(private readonly articleService: ArticleService,
    private readonly categoryService: CategoryService
  ) {}


// @Get()
//  getArticlesMerged(
//     @Query('page') page = '1',
//     @Query('limit') limit = '10'
//   ) {
//     const pageNumber = parseInt(page, 10) || 1;
//     const limitNumber = parseInt(limit, 10) || 10;

//     return this.articleService.findArticlesWithImagesMerged(pageNumber, limitNumber);
//   }

@Get()
async getArticlesMerged(
  @Query('page') page = '1',
  @Query('limit') limit = '10',
  @Query('categorySlug') categorySlug?: string,
) {
  const pageNumber = parseInt(page, 10) || 1;
  const limitNumber = parseInt(limit, 10) || 10;
  let categoryId: number | undefined;

  if (categorySlug) {
    const category = await this.categoryService.findBySlug(categorySlug);
    if (category) {
      categoryId = category.term_id;
    } else {
      return {
        articles: [],
        total: 0,
        totalPages: 0,
        articlesCount: 0,
        firstArticle: null,
        firstArticleImage: null,
      };
    }
  }

  return this.articleService.findArticlesWithImagesMerged(
    pageNumber,
    limitNumber,
    categoryId,
  );
}


  @Get('admin')
  getAllArticlesAdmin() {
    return this.articleService.findAll();
  }

  // 👇 Récupérer un article par son slug
  @Get(':slug')
  getArticleBySlug(@Param('slug') slug: string) {
    return this.articleService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createArticle(@Body() data) {
    return this.articleService.create(data);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  updateArticle(@Param('id') id: string, @Body() data) {
    return this.articleService.update(+id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteArticle(@Param('id') id: string) {
    return this.articleService.delete(+id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/publish')
  publishArticle(@Param('id') id: string) {
    return this.articleService.publish(+id);
  }
}
