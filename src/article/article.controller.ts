// import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards, NotFoundException, UsePipes, ValidationPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { diskStorage } from 'multer';
// import { extname } from 'path';
// import * as fs from 'fs';
// import * as path from 'path';
// import { ArticleService } from './article.service';
// import { CreateArticleDto } from 'src/dtos/create-article.dto';
// import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
// import { CategoryService } from 'src/category/category.service';
// import cloudinary from 'src/cloudinary/cloudinary.provider';
// import * as streamifier from 'streamifier';

// @Controller('articles')
// export class ArticleController {
//   constructor(
//     private readonly articleService: ArticleService,
//     private readonly categoryService: CategoryService
//   ) {}

//   // @Post('with-image')
//   // @UseInterceptors(FileInterceptor('image', {
//   //   storage: diskStorage({
//   //     destination: (req, file, cb) => {
//   //       const year = new Date().getFullYear();
//   //       const month = String(new Date().getMonth() + 1).padStart(2, '0');
//   //       const uploadPath = path.join(process.cwd(), 'uploads', year.toString(), month);
        
//   //       if (!fs.existsSync(uploadPath)) {
//   //         fs.mkdirSync(uploadPath, { recursive: true });
//   //       }
        
//   //       cb(null, uploadPath);
//   //     },
//   //     filename: (req, file, cb) => {
//   //       const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//   //       cb(null, file.fieldname + '-' + uniqueSuffix + extname(file.originalname));
//   //     },
//   //   }),
//   // }))
//   // async createArticleWithImage(
//   //   @Body() createArticleDto: CreateArticleDto,
//   //   @UploadedFile() file?: Express.Multer.File
//   // ) {
//   //   try {
//   //     if (file) {
//   //       console.log('Fichier uploadé:', file.path);
//   //       const article = await this.articleService.createWithImage(createArticleDto, file.path);
//   //       return {
//   //         success: true,
//   //         message: 'Article créé avec image avec succès',
//   //         data: article
//   //       };
//   //     } else {
//   //       const article = await this.articleService.create(createArticleDto);
//   //       return {
//   //         success: true,
//   //         message: 'Article créé sans image',
//   //         data: article
//   //       };
//   //     }
//   //   } catch (error) {
//   //     console.error('Erreur lors de la création:', error);
//   //     return {
//   //       success: false,
//   //       message: 'Erreur lors de la création de l\'article',
//   //       error: error.message
//   //     };
//   //   }
//   // }

//     @Post('with-image')
//   @UseInterceptors(FileInterceptor('image'))
//   async createArticleWithImage(
//     @Body() createArticleDto: CreateArticleDto,
//     @UploadedFile() file?: Express.Multer.File
//   ) {
//     try {
//       let imageUrl: string | undefined = undefined;

//       if (file) {
//         // Upload sur Cloudinary
//         const result: any = await new Promise((resolve, reject) => {
//           const uploadStream = cloudinary.uploader.upload_stream(
//             {
//               folder: `articles/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`,
//             },
//             (error, result) => {
//               if (error) return reject(error);
//               resolve(result);
//             }
//           );
//           streamifier.createReadStream(file.buffer).pipe(uploadStream);
//         });

//         imageUrl = result.secure_url;
//         console.log('Image uploadée sur Cloudinary:', imageUrl);
//       }

//       // Créer l'article et associer l'image
//       const article = await this.articleService.createWithImage(createArticleDto, imageUrl);

//       return {
//         success: true,
//         message: 'Article créé avec image sur Cloudinary avec succès',
//         data: article,
//       };
//     } catch (error) {
//       console.error('Erreur lors de la création de l\'article:', error);
//       return {
//         success: false,
//         message: 'Erreur lors de la création de l\'article',
//         error: error.message,
//       };
//     }
//   }


//   @Post('no-validation')
//   async createWithoutValidation(@Body() body: any) {
//     const cleaned = {
//       postTitle: body?.postTitle ? String(body.postTitle).trim() : 'Titre par défaut',
//       postContent: body?.postContent ? String(body.postContent).trim() : 'Contenu par défaut',
//       postExcerpt: body?.postExcerpt ? String(body.postExcerpt).trim() : '',
//       postStatus: body?.postStatus ? String(body.postStatus).trim() : 'draft',
//       postName: body?.postName ? String(body.postName).trim() : undefined,
//       imagePath: body?.imagePath ? String(body.imagePath).trim() : undefined // Ajout de imagePath
//     };
    
//     console.log('=== CRÉATION SANS VALIDATION ===');
//     console.log('Données nettoyées:', cleaned);
    
//     try {
//       const result = await this.articleService.create(cleaned as CreateArticleDto);
//       return {
//         success: true,
//         article: result,
//         message: 'Article créé avec succès'
//       };
//     } catch (error) {
//       console.error('Erreur lors de la création:', error);
//       return {
//         success: false,
//         error: error.message,
//         cleanedData: cleaned
//       };
//     }
//   }

//   @Post('with-existing-image')
//   async createArticleWithExistingImage(@Body() body: any) {
//     try {
//       const { imagePath, ...articleData } = body;
      
//       const cleaned = {
//         postTitle: articleData?.postTitle ? String(articleData.postTitle).trim() : 'Titre par défaut',
//         postContent: articleData?.postContent ? String(articleData.postContent).trim() : 'Contenu par défaut',
//         postExcerpt: articleData?.postExcerpt ? String(articleData.postExcerpt).trim() : '',
//         postStatus: articleData?.postStatus ? String(articleData.postStatus).trim() : 'draft',
//         postName: articleData?.postName ? String(articleData.postName).trim() : undefined,
//         imagePath: imagePath ? String(imagePath).trim() : undefined
//       };

//       console.log('=== CRÉATION AVEC IMAGE EXISTANTE ===');
//       console.log('Données nettoyées:', cleaned);

//       const article = await this.articleService.create(cleaned as CreateArticleDto);
//       return {
//         success: true,
//         message: 'Article créé avec image existante avec succès',
//         data: article
//       };
//     } catch (error) {
//       console.error('Erreur lors de la création:', error);
//       return {
//         success: false,
//         message: 'Erreur lors de la création de l\'article',
//         error: error.message
//       };
//     }
//   }

//   // @UseGuards(JwtAuthGuard)
//   @Get('search')
//   async searchArticles(
//     @Query('query') query: string,
//     @Query('page') page = 1,
//     @Query('limit') limit = 10,
//   ) {
//     const result = await this.articleService.searchArticles(query, +page, +limit);

//     if (!result.articles || result.articles.length === 0) {
//       throw new NotFoundException('Article non trouvé');
//     }

//     return result;
//   }

//   // @UseGuards(JwtAuthGuard)
//   @Get()
//   async getArticlesMerged(
//     @Query('page') page = '1',
//     @Query('limit') limit = '10',
//     @Query('categorySlug') categorySlug?: string,
//   ) {
//     const pageNumber = parseInt(page, 10) || 1;
//     const limitNumber = parseInt(limit, 10) || 10;
//     let categoryId: number | undefined;

//     if (categorySlug) {
//       const category = await this.categoryService.findBySlug(categorySlug);
//       if (category) {
//         categoryId = category.term_id;
//       } else {
//         return {
//           articles: [],
//           total: 0,
//           totalPages: 0,
//           articlesCount: 0,
//           firstArticle: null,
//           firstArticleImage: null,
//         };
//       }
//     }

//     return this.articleService.findArticlesWithImagesMerged(
//       pageNumber,
//       limitNumber,
//       categoryId,
//     );
//   }

//   // @UseGuards(JwtAuthGuard)


//   @Get('admin')
//   getAllArticlesAdmin() {
//     return this.articleService.findAll();
//   }

//   // @UseGuards(JwtAuthGuard)
//   @Get(':slug')
//   getArticleBySlug(@Param('slug') slug: string) {
//     console.log('=== RÉCUPÉRATION ARTICLE PAR SLUG ===');
//     console.log('Slug demandé:', slug);
//     return this.articleService.findBySlug(slug);
//   }

//   // @UseGuards(JwtAuthGuard)
//   @Post()
//   @UsePipes(new ValidationPipe({ 
//     transform: true, 
//     whitelist: true,
//     forbidNonWhitelisted: true,
//     enableDebugMessages: true
//   }))
//   async createArticle(@Body() createArticleDto: CreateArticleDto) {
//     console.log('=== CREATE AVEC VALIDATION ===');
//     console.log('DTO après validation:', createArticleDto);
//     return this.articleService.create(createArticleDto);
//   }

//   // @UseGuards(JwtAuthGuard)
//   @Put(':id')
//   updateArticle(@Param('id') id: string, @Body() data: any) {
//     return this.articleService.update(+id, data);
//   }

//   // @UseGuards(JwtAuthGuard)
//   @Delete(':id')
//   deleteArticle(@Param('id') id: string) {
//     return this.articleService.delete(+id);
//   }

//   // @UseGuards(JwtAuthGuard)
//   @Patch(':id/publish')
//   publishArticle(@Param('id') id: string) {
//     return this.articleService.publish(+id);
//   }
// }

import { Controller, Get, Post, Put, Delete, Patch, Param, Body, Query, UseGuards, NotFoundException, UsePipes, ValidationPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ArticleService } from './article.service';
import { CreateArticleDto } from 'src/dtos/create-article.dto';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { CategoryService } from 'src/category/category.service';
import cloudinary from 'src/cloudinary/cloudinary.provider';
import * as streamifier from 'streamifier';

@Controller('articles')
export class ArticleController {
  constructor(
    private readonly articleService: ArticleService,
    private readonly categoryService: CategoryService
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
}