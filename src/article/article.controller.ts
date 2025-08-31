import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards, NotFoundException, UsePipes, ValidationPipe, UseInterceptors, UploadedFile, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ArticleService } from './article.service';
import { CreateArticleDto } from 'src/dtos/create-article.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { CategoryService } from 'src/category/category.service';
import cloudinary from 'src/cloudinary/cloudinary.provider';
import * as streamifier from 'streamifier';
import { MediaService } from 'src/media/media.service';

@Controller('articles')
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly categoryService: CategoryService,
    private readonly mediaService: MediaService,
  ) {}

  @Post('with-image')
  @UseInterceptors(FileInterceptor('image'))
  async createArticleWithImage(
    @Body() createArticleDto: CreateArticleDto,
    @UploadedFile() file?: Express.Multer.File
  ) {
    try {
      let cloudinaryUrl: string | undefined = undefined;

      if (file) {
        console.log('📤 Upload de l\'image vers Cloudinary...');
        
        // Upload sur Cloudinary
        const result: any = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: `articles/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`,
              resource_type: 'auto', // Permet d'uploader tous types de fichiers
            },
            (error, result) => {
              if (error) {
                console.error('❌ Erreur upload Cloudinary:', error);
                return reject(error);
              }
              resolve(result);
            }
          );
          streamifier.createReadStream(file.buffer).pipe(uploadStream);
        });

        cloudinaryUrl = result.secure_url;
        console.log('✅ Image uploadée sur Cloudinary:', cloudinaryUrl);
      }

      // Créer l'article avec l'URL Cloudinary
      const article = await this.articleService.createWithImage(createArticleDto, cloudinaryUrl);

      return {
        success: true,
        message: file ? 'Article créé avec image Cloudinary avec succès' : 'Article créé sans image',
        data: article,
        cloudinaryUrl: cloudinaryUrl
      };
    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'article:', error);
      return {
        success: false,
        message: 'Erreur lors de la création de l\'article',
        error: error.message,
      };
    }
  }

  @Post('with-cloudinary-url')
  async createArticleWithCloudinaryUrl(@Body() body: any) {
    try {
      const { cloudinaryUrl, ...articleData } = body;
      
      const cleaned = {
        postTitle: articleData?.postTitle ? String(articleData.postTitle).trim() : 'Titre par défaut',
        postContent: articleData?.postContent ? String(articleData.postContent).trim() : 'Contenu par défaut',
        postExcerpt: articleData?.postExcerpt ? String(articleData.postExcerpt).trim() : '',
        postStatus: articleData?.postStatus ? String(articleData.postStatus).trim() : 'draft',
        postName: articleData?.postName ? String(articleData.postName).trim() : undefined,
        cloudinaryUrl: cloudinaryUrl ? String(cloudinaryUrl).trim() : undefined
      };

      console.log('=== CRÉATION AVEC URL CLOUDINARY ===');
      console.log('Données nettoyées:', cleaned);
      console.log('URL Cloudinary:', cleaned.cloudinaryUrl);

      const article = await this.articleService.createWithImage(cleaned as CreateArticleDto, cleaned.cloudinaryUrl);
      
      return {
        success: true,
        message: 'Article créé avec URL Cloudinary avec succès',
        data: article
      };
    } catch (error) {
      console.error('❌ Erreur lors de la création:', error);
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
      cloudinaryUrl: body?.cloudinaryUrl ? String(body.cloudinaryUrl).trim() : undefined
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
      console.error('❌ Erreur lors de la création:', error);
      return {
        success: false,
        error: error.message,
        cleanedData: cleaned
      };
    }
  }

  // Endpoint pour migrer un article existant vers Cloudinary
  @Patch(':id/migrate-to-cloudinary')
  async migrateToCloudinary(@Param('id') id: string, @Body() body: { cloudinaryUrl: string }) {
    try {
      const { cloudinaryUrl } = body;
      
      if (!cloudinaryUrl) {
        return {
          success: false,
          message: 'URL Cloudinary requise'
        };
      }

      // Récupérer l'article
      const article = await this.articleService.findBySlug(id);
      if (!article) {
        throw new NotFoundException('Article non trouvé');
      }

      // Extraire le nom du fichier de l'URL Cloudinary
      const fileName = cloudinaryUrl.split('/').pop() || 'cloudinary-image';
      
      // Créer une nouvelle entrée d'image avec l'URL Cloudinary
      const imageId = await this.articleService.createCloudinaryImagePost(cloudinaryUrl, fileName);
      
      // Associer la nouvelle image à l'article
      await this.articleService.attachImageToArticle(parseInt(id), imageId);

      return {
        success: true,
        message: 'Article migré vers Cloudinary avec succès',
        cloudinaryUrl: cloudinaryUrl,
        imageId: imageId
      };
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      return {
        success: false,
        message: 'Erreur lors de la migration vers Cloudinary',
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

  // @Get('admin')
  // getAllArticlesAdmin() {
  //   return this.articleService.findAll();
  // }

  @Get('admin')
async getAllArticlesAdmin() {
  try {
    // Récupérer tous les articles
    const articles = await this.articleService.findAll();

    // Extraire les IDs
    const postIds = articles.map(article => article.ID);

    // Récupérer les vues par article
    const viewsMap = await this.mediaService.getViewsForMultiplePosts(postIds);

    // Ajouter les vues aux articles
    const articlesWithViews = articles.map(article => ({
      ...article,
      views: viewsMap[article.ID] || 0
    }));

    return { articles: articlesWithViews };
  } catch (error) {
    throw new InternalServerErrorException(error.message);
  }
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
  // @Put(':id')
  // updateArticle(@Param('id') id: string, @Body() data: any) {
  //   return this.articleService.update(+id, data);
  // }

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

  // Endpoint pour tester la connexion Cloudinary
  @Get('test/cloudinary')
  async testCloudinary() {
    try {
      const result = await cloudinary.api.ping();
      return {
        success: true,
        message: 'Connexion Cloudinary OK',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur connexion Cloudinary',
        error: error.message
      };
    }
  }

  
@Put(':id')
@UseInterceptors(FileInterceptor('image'))
async updateArticle(
  @Param('id') id: string,
  @Body() updateData: any,
  @UploadedFile() file?: Express.Multer.File
) {
  try {
    const articleId = parseInt(id);
    let cloudinaryUrl: string | undefined = undefined;

    // Si un nouveau fichier est uploadé
    if (file) {
      console.log('📤 Upload de la nouvelle image vers Cloudinary...');
      
      const result: any = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: `articles/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`,
            resource_type: 'auto',
          },
          (error, result) => {
            if (error) {
              console.error('❌ Erreur upload Cloudinary:', error);
              return reject(error);
            }
            resolve(result);
          }
        );
        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });

      cloudinaryUrl = result.secure_url;
      console.log('✅ Nouvelle image uploadée:', cloudinaryUrl);
    }

    // Mettre à jour l'article avec la nouvelle image si fournie
    const updatedArticle = await this.articleService.updateWithImage(
      articleId, 
      updateData, 
      cloudinaryUrl
    );

    return {
      success: true,
      message: 'Article mis à jour avec succès',
      data: updatedArticle
    };
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
    return {
      success: false,
      message: 'Erreur lors de la mise à jour de l\'article',
      error: error.message
    };
  }
}

@Put(':id/cloudinary-url')
async updateArticleWithCloudinaryUrl(
  @Param('id') id: string,
  @Body() body: { cloudinaryUrl?: string; [key: string]: any }
) {
  try {
    const articleId = parseInt(id);
    const { cloudinaryUrl, ...updateData } = body;

    console.log('=== MISE À JOUR AVEC URL CLOUDINARY ===');
    console.log('Article ID:', articleId);
    console.log('Nouvelle URL Cloudinary:', cloudinaryUrl);
    console.log('Autres données:', updateData);

    const updatedArticle = await this.articleService.updateWithImage(
      articleId, 
      updateData, 
      cloudinaryUrl
    );

    return {
      success: true,
      message: 'Article mis à jour avec URL Cloudinary',
      data: updatedArticle
    };
  } catch (error) {
    console.error('❌ Erreur mise à jour:', error);
    return {
      success: false,
      message: 'Erreur lors de la mise à jour',
      error: error.message
    };
  }
}

@Patch(':id/image')
async updateArticleImage(
  @Param('id') id: string,
  @Body() body: { cloudinaryUrl: string }
) {
  try {
    const articleId = parseInt(id);
    const { cloudinaryUrl } = body;

    if (!cloudinaryUrl) {
      return {
        success: false,
        message: 'URL Cloudinary requise'
      };
    }

    await this.articleService.updateArticleImage(articleId, cloudinaryUrl);

    return {
      success: true,
      message: 'Image de l\'article mise à jour avec succès',
      cloudinaryUrl: cloudinaryUrl
    };
  } catch (error) {
    console.error('❌ Erreur mise à jour image:', error);
    return {
      success: false,
      message: 'Erreur lors de la mise à jour de l\'image',
      error: error.message
    };
  }
}

  // Endpoint pour lister les images Cloudinary d'un dossier
  @Get('cloudinary/list/:folder')
  async listCloudinaryImages(@Param('folder') folder: string) {
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: folder,
        max_results: 50
      });
      
      return {
        success: true,
        images: result.resources.map((resource: any) => ({
          public_id: resource.public_id,
          url: resource.secure_url,
          format: resource.format,
          size: resource.bytes,
          created_at: resource.created_at
        }))
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de la récupération des images',
        error: error.message
      };
    }
  }

   @Post(':id/increment-view')
  async incrementViews(@Param('id') id: string) {
    try {
      const postId = parseInt(id);
      if (isNaN(postId)) {
        throw new BadRequestException('ID d\'article invalide');
      }

      const views = await this.mediaService.incrementPostViews(postId);
      
      return {
        success: true,
        postId,
        views
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }

  // Route pour récupérer les vues d'un article
  @Get(':id/views')
  async getViews(@Param('id') id: string) {
    try {
      const postId = parseInt(id);
      if (isNaN(postId)) {
        throw new BadRequestException('ID d\'article invalide');
      }

      const views = await this.mediaService.getPostViews(postId);
      
      return {
        postId,
        views
      };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }


  // Route pour les articles les plus vus (pour analytics)
  @Get('most-viewed')
  async getMostViewedArticles(@Query('limit') limit = 10) {
    try {
      const mostViewed = await this.mediaService.getMostViewedPosts(limit);
      return { mostViewed };
    } catch (error) {
      throw new InternalServerErrorException(error.message);
    }
  }
}