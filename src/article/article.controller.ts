import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards, NotFoundException, UsePipes, ValidationPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as fs from 'fs';
import * as path from 'path';
import { ArticleService } from './article.service';
import { CreateArticleDto } from 'src/dtos/create-article.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { CategoryService } from 'src/category/category.service';

@Controller('articles')
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly categoryService: CategoryService
  ) {}

  @Post('with-image')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const year = new Date().getFullYear();
        const month = String(new Date().getMonth() + 1).padStart(2, '0');
        const uploadPath = path.join(process.cwd(), 'uploads', year.toString(), month);
        
        if (!fs.existsSync(uploadPath)) {
          fs.mkdirSync(uploadPath, { recursive: true });
        }
        
        cb(null, uploadPath);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
      },
    }),
  }))
  async createArticleWithImage(
    @Body() createArticleDto: CreateArticleDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    try {
      if (file) {
        console.log('Fichier uploadé:', file.path);
        const article = await this.articleService.createWithImage(createArticleDto, file.path);
        return {
          success: true,
          message: 'Article créé avec image avec succès',
          data: article
        };
      } else {
        const article = await this.articleService.create(createArticleDto);
        return {
          success: true,
          message: 'Article créé sans image',
          data: article
        };
      }
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      return {
        success: false,
        message: 'Erreur lors de la création de l\'article',
        error: error.message
      };
    }
  }

  @Post('no-validation')
  async createWithoutValidation(@Body() body: any) {
    const cleaned = {
      postTitle: body?.postTitle ? String(body.postTitle).trim() : 'Titre par défaut',
      postContent: body?.postContent ? String(body.postContent).trim() : 'Contenu par défaut',
      postExcerpt: body?.postExcerpt ? String(body.postExcerpt).trim() : '',
      postStatus: body?.postStatus ? String(body.postStatus).trim() : 'draft',
      postName: body?.postName ? String(body.postName).trim() : undefined,
      imagePath: body?.imagePath ? String(body.imagePath).trim() : undefined // Ajout de imagePath
    };
    
    console.log('=== CRÉATION SANS VALIDATION ===');
    console.log('Données nettoyées:', cleaned);
    
    try {
      const result = await this.articleService.create(cleaned as CreateArticleDto);
      return {
        success: true,
        article: result,
        message: 'Article créé avec succès'
      };
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      return {
        success: false,
        error: error.message,
        cleanedData: cleaned
      };
    }
  }

  @Post('with-existing-image')
  async createArticleWithExistingImage(@Body() body: any) {
    try {
      const { imagePath, ...articleData } = body;
      
      const cleaned = {
        postTitle: articleData?.postTitle ? String(articleData.postTitle).trim() : 'Titre par défaut',
        postContent: articleData?.postContent ? String(articleData.postContent).trim() : 'Contenu par défaut',
        postExcerpt: articleData?.postExcerpt ? String(articleData.postExcerpt).trim() : '',
        postStatus: articleData?.postStatus ? String(articleData.postStatus).trim() : 'draft',
        postName: articleData?.postName ? String(articleData.postName).trim() : undefined,
        imagePath: imagePath ? String(imagePath).trim() : undefined
      };

      console.log('=== CRÉATION AVEC IMAGE EXISTANTE ===');
      console.log('Données nettoyées:', cleaned);

      const article = await this.articleService.create(cleaned as CreateArticleDto);
      return {
        success: true,
        message: 'Article créé avec image existante avec succès',
        data: article
      };
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      return {
        success: false,
        message: 'Erreur lors de la création de l\'article',
        error: error.message
      };
    }
  }

  // @UseGuards(JwtAuthGuard)
  @Get('search')
  async searchArticles(
    @Query('query') query: string,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    const result = await this.articleService.searchArticles(query, +page, +limit);

    if (!result.articles || result.articles.length === 0) {
      throw new NotFoundException('Article non trouvé');
    }

    return result;
  }

  // @UseGuards(JwtAuthGuard)
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

  // @UseGuards(JwtAuthGuard)


  @Get('admin')
  getAllArticlesAdmin() {
    return this.articleService.findAll();
  }

  // @UseGuards(JwtAuthGuard)
  @Get(':slug')
  getArticleBySlug(@Param('slug') slug: string) {
    console.log('=== RÉCUPÉRATION ARTICLE PAR SLUG ===');
    console.log('Slug demandé:', slug);
    return this.articleService.findBySlug(slug);
  }

  // @UseGuards(JwtAuthGuard)
  @Post()
  @UsePipes(new ValidationPipe({ 
    transform: true, 
    whitelist: true,
    forbidNonWhitelisted: true,
    enableDebugMessages: true
  }))
  async createArticle(@Body() createArticleDto: CreateArticleDto) {
    console.log('=== CREATE AVEC VALIDATION ===');
    console.log('DTO après validation:', createArticleDto);
    return this.articleService.create(createArticleDto);
  }

  // @UseGuards(JwtAuthGuard)
  @Put(':id')
  updateArticle(@Param('id') id: string, @Body() data: any) {
    return this.articleService.update(+id, data);
  }

  // @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteArticle(@Param('id') id: string) {
    return this.articleService.delete(+id);
  }

  // @UseGuards(JwtAuthGuard)
  @Patch(':id/publish')
  publishArticle(@Param('id') id: string) {
    return this.articleService.publish(+id);
  }
}