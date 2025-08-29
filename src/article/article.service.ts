// import { Injectable, NotFoundException } from '@nestjs/common';
// import { Repository } from 'typeorm';
// import { Article } from './article.entity';
// import { InjectRepository } from '@nestjs/typeorm';
// import { MediaMeta } from 'src/media/media.entity';
// import { DataSource } from 'typeorm';
// import { User } from 'src/user/user.entity';
// import { CreateArticleDto } from 'src/dtos/create-article.dto';

// @Injectable()
// export class ArticleService {
//   constructor(
//     @InjectRepository(Article)
//     private readonly articleRepo: Repository<Article>,
//     private readonly dataSource: DataSource,
//   ) { }

//   async findPublic() {
//     const articles = await this.articleRepo.find({
//       where: {
//         postType: 'post',
//         postStatus: 'publish',
//       },
//       order: {
//         postDate: 'DESC',
//       },
//     });

//     const authorIds = [...new Set(articles.map(a => a.postAuthor).filter(id => id !== 0))];

//     const authors = await this.dataSource
//       .getRepository(User)
//       .findByIds(authorIds);

//     const articlesWithAuthors = articles.map(article => ({
//       ...article,
//       author: article.postAuthor === 0 ? null : authors.find(u => u.ID === article.postAuthor) || null,
//     }));

//     return articlesWithAuthors;
//   }

//   async findBySlug(slug: string) {
//     const article = await this.articleRepo.findOneBy({
//       postName: slug,
//       postStatus: 'publish'
//     });

//     if (!article) {
//       console.log('Article non trouvé pour ce slug:', slug);
//       throw new NotFoundException('Article non trouvé');
//     }

//     console.log('=== RECHERCHE IMAGE POUR ARTICLE ===');
//     console.log('Article ID:', article.ID);

//     const imageMeta = await this.dataSource
//       .createQueryBuilder()
//       .select('file_meta.meta_value', 'image')
//       .from('wp_postmeta', 'thumb_meta')
//       .leftJoin('wp_postmeta', 'file_meta', 'file_meta.post_id = thumb_meta.meta_value AND file_meta.meta_key = :fileKey', { fileKey: '_wp_attached_file' })
//       .where('thumb_meta.post_id = :postId', { postId: article.ID })
//       .andWhere('thumb_meta.meta_key = :thumbnailKey', { thumbnailKey: '_thumbnail_id' })
//       .getRawOne();

//     console.log('Métadonnées image trouvées:', imageMeta);

//     const appUrl = process.env.APP_URL || 'https://xibarubamback.onrender.com';
//     // const imageUrl = imageMeta?.image ? `${appUrl}/uploads/${imageMeta.image}` : null;
//     const imageUrl = imageMeta?.cloud_url || imageMeta?.guid || null;


//     console.log('URL finale de l\'image:', imageUrl);

//     const categories = await this.getCategoriesByArticle(article.ID);

//     return {
//       ...article,
//       image: imageUrl,
//       categories,
//     };
//   }

 
// async getCategoriesByArticle(articleId: number) {
//   // console.log(`Getting categories for article ${articleId}`);
  
//   const categories = await this.dataSource
//     .createQueryBuilder()
//     .select('t.term_id', 'term_id')
//     .addSelect('t.name', 'name')
//     .addSelect('t.slug', 'slug')
//     .from('wp_term_relationships', 'tr')
//     .innerJoin('wp_term_taxonomy', 'tt', 'tt.term_taxonomy_id = tr.term_taxonomy_id')
//     .innerJoin('wp_terms', 't', 't.term_id = tt.term_id')
//     .where('tr.object_id = :articleId', { articleId })
//     .andWhere('tt.taxonomy = :taxonomy', { taxonomy: 'category' })
//     .getRawMany();

//   // console.log(`Raw categories for article ${articleId}:`, categories);

//   // Mapper pour avoir un format uniforme
//   const mappedCategories = categories.map(cat => ({
//     id: cat.term_id,       // Utiliser term_id comme id
//     term_id: cat.term_id,  // Garder aussi term_id
//     name: cat.name,
//     slug: cat.slug
//   }));

//   // console.log(`Mapped categories for article ${articleId}:`, mappedCategories);
//   return mappedCategories;
// }
//   async create(createArticleDto: CreateArticleDto) {
//     const { 
//       postTitle, 
//       postContent, 
//       postExcerpt = '', 
//       postStatus = 'draft', 
//       postName,
//       thumbnailId,
//       imagePath // Ajout de imagePath
//     } = createArticleDto;

//     if (!postTitle) throw new Error('postTitle is required');
//     if (!postContent) throw new Error('postContent is required');

//     const slug = postName || this.slugify(postTitle);

//     // Créer l'article
//     const article = this.articleRepo.create({
//       postTitle,
//       postContent,
//       postExcerpt,
//       postStatus,
//       postName: slug,
//       postType: 'post',
//       postDate: new Date(),
//       postDateGmt: new Date(),
//       postModified: new Date(),
//       postModifiedGmt: new Date(),
//       guid: '', 
//       commentStatus: 'open',
//       pingStatus: 'open',
//       postPassword: '',
//       toPing: '',
//       pinged: '',
//       postContentFiltered: '',
//       postParent: 0,
//       menuOrder: 0,
//       postMimeType: '',
//       commentCount: 0,
//       postAuthor: 0,
//     });

//     const savedArticle = await this.articleRepo.save(article);

//     const appUrl = process.env.APP_URL || 'https://xibarubamback.onrender.com';
//     savedArticle.guid = `${appUrl}/?p=${savedArticle.ID}`;

//     await this.articleRepo.save(savedArticle);

//     // Si une image est fournie, l'associer à l'article
//     if (thumbnailId) {
//       await this.attachImageToArticle(savedArticle.ID, thumbnailId);
//     }

//     // Si un chemin d'image est fourni, créer l'entrée image et l'associer
//     if (imagePath) {
//       console.log('Traitement de l\'image avec le chemin:', imagePath);
      
//       // Extraire le nom du fichier du chemin complet
//       const fileName = imagePath.split('\\').pop() || imagePath.split('/').pop() || 'unknown';
//       console.log('Nom du fichier extrait:', fileName);
      
//       // Convertir le chemin Windows en chemin relatif pour la base de données
//       const relativePath = imagePath
//         .replace(/.*\\uploads\\/, '')
//         .replace(/.*\/uploads\//, '')
//         .replace(/\\/g, '/');
//       console.log('Chemin relatif:', relativePath);

//       // Créer l'entrée d'image
//       const imageId = await this.createImagePost(relativePath, fileName);
//       console.log('ID de l\'image créée:', imageId);

//       // Associer l'image à l'article
//       await this.attachImageToArticle(savedArticle.ID, imageId);
//       console.log('Image associée à l\'article:', savedArticle.ID);
//     }

//     return savedArticle;
//   }

//   // Nouvelle méthode pour créer une entrée d'image dans wp_posts
//   async createImagePost(filePath: string, fileName: string): Promise<number> {
//     const imagePost = this.articleRepo.create({
//       postTitle: fileName,
//       postContent: '',
//       postExcerpt: '',
//       postStatus: 'inherit',
//       postName: this.slugify(fileName),
//       postType: 'attachment',
//       postDate: new Date(),
//       postDateGmt: new Date(),
//       postModified: new Date(),
//       postModifiedGmt: new Date(),
//       guid: `${process.env.APP_URL || 'https://xibarubamback.onrender.com'}/uploads/${filePath}`,
//       commentStatus: 'open',
//       pingStatus: 'closed',
//       postPassword: '',
//       toPing: '',
//       pinged: '',
//       postContentFiltered: '',
//       postParent: 0,
//       menuOrder: 0,
//       postMimeType: this.getMimeType(fileName),
//       commentCount: 0,
//       postAuthor: 0,
//     });

//     const savedImagePost = await this.articleRepo.save(imagePost);

//     // Ajouter les métadonnées de l'image
//     await this.dataSource
//       .createQueryBuilder()
//       .insert()
//       .into('wp_postmeta')
//       .values([
//         {
//           post_id: savedImagePost.ID,
//           meta_key: '_wp_attached_file',
//           meta_value: filePath
//         }
//       ])
//       .execute();

//     return savedImagePost.ID;
//   }

//   // Méthode pour associer une image à un article
//   async attachImageToArticle(articleId: number, imageId: number): Promise<void> {
//     console.log('=== ASSOCIATION IMAGE À L\'ARTICLE ===');
//     console.log('Article ID:', articleId);
//     console.log('Image ID:', imageId);
    
//     try {
//       const result = await this.dataSource
//         .createQueryBuilder()
//         .insert()
//         .into('wp_postmeta')
//         .values({
//           post_id: articleId,
//           meta_key: '_thumbnail_id',
//           meta_value: imageId.toString()
//         })
//         .execute();
      
//       console.log('Résultat de l\'insertion thumbnail:', result);
      
//       // Vérifier que l'insertion a bien eu lieu
//       const verification = await this.dataSource
//         .createQueryBuilder()
//         .select('*')
//         .from('wp_postmeta', 'meta')
//         .where('meta.post_id = :postId', { postId: articleId })
//         .andWhere('meta.meta_key = :metaKey', { metaKey: '_thumbnail_id' })
//         .getRawOne();
        
//       console.log('Vérification thumbnail dans la base:', verification);
//     } catch (error) {
//       console.error('Erreur lors de l\'association image:', error);
//       throw error;
//     }
//   }

//   // Méthode pour obtenir le type MIME d'un fichier
//   private getMimeType(fileName: string): string {
//     const extension = fileName.split('.').pop()?.toLowerCase();
//     if (!extension) return 'application/octet-stream'; // Fixed: handle undefined extension
    
//     const mimeTypes: Record<string, string> = { // Fixed: added proper type annotation
//       'jpg': 'image/jpeg',
//       'jpeg': 'image/jpeg',
//       'png': 'image/png',
//       'gif': 'image/gif',
//       'webp': 'image/webp',
//       'svg': 'image/svg+xml',
//     };
//     return mimeTypes[extension] || 'application/octet-stream';
//   }

//   // Méthode complète pour créer un article avec image
//   async createWithImage(createArticleDto: CreateArticleDto, imagePath?: string): Promise<any> {
//     // Créer l'article d'abord
//     const article = await this.create(createArticleDto);

//     // Si un chemin d'image est fourni, créer l'entrée image et l'associer
//     if (imagePath) {
//       // Extraire le nom du fichier du chemin complet
//       const fileName = imagePath.split('\\').pop() || imagePath.split('/').pop() || 'unknown'; // Fixed: handle undefined
      
//       // Convertir le chemin Windows en chemin relatif pour la base de données
//       // C:\Users\hp\Desktop\backendxibarubambouck\uploads\2025\04\filename.jpeg
//       // devient: 2025/04/filename.jpeg
//       const relativePath = imagePath
//         .replace(/.*\\uploads\\/, '')
//         .replace(/.*\/uploads\//, '')
//         .replace(/\\/g, '/');

//       // Créer l'entrée d'image
//       const imageId = await this.createImagePost(relativePath, fileName);

//       // Associer l'image à l'article
//       await this.attachImageToArticle(article.ID, imageId);
//     }

//     // Retourner l'article avec l'image
//     return this.findBySlug(article.postName);
//   }

//   private slugify(title: string): string {
//     return title
//       .toLowerCase()
//       .trim()
//       .replace(/\s+/g, '-')      
//       .replace(/[^\w\-]+/g, ''); 
//   }

//   async update(id: number, data: Partial<Article>) { // Fixed: added proper type
//     await this.articleRepo.update(id, data);
//     return this.articleRepo.findOneBy({ ID: id });
//   }

//   async delete(id: number) {
//     await this.articleRepo.delete(id);
//   }

//   async publish(id: number) {
//     const article = await this.articleRepo.findOneBy({ ID: id });
//     if (!article) throw new NotFoundException('Article non trouvé');
//     article.postStatus = 'publish';
//     article.postModified = new Date();
//     article.postModifiedGmt = new Date();
//     return this.articleRepo.save(article);
//   }

//   async findAll() {
//     return this.articleRepo.find({
//       order: {
//         postDate: 'DESC',
//       },
//     });
//   }

//   async findByType(postType: string) {
//     return this.articleRepo.find({
//       where: { postType },
//       order: { postDate: 'DESC' },
//     });
//   }

//   async findByAuthor(authorId: number) {
//     return this.articleRepo.find({
//       where: { postAuthor: authorId },
//       order: { postDate: 'DESC' },
//     });
//   }

// async findArticlesWithImagesMerged(page: number, limit: number, categoryId?: number) {
//   const offset = (page - 1) * limit;

//   const qb = this.dataSource
//     .createQueryBuilder()
//     .select([
//       'article.ID AS id',
//       'article.post_title AS title',
//       'article.post_excerpt AS excerpt',
//       'article.post_content AS content',
//       'article.post_date AS date',
//       'article.post_name AS slug',
//       'file_meta.meta_value AS image',
//     ])
//     .from(Article, 'article')
//     .leftJoin('wp_postmeta', 'thumb_meta', 'thumb_meta.post_id = article.ID AND thumb_meta.meta_key = :thumbnailKey', {
//       thumbnailKey: '_thumbnail_id',
//     })
//     .leftJoin('wp_postmeta', 'file_meta', 'file_meta.post_id = thumb_meta.meta_value AND file_meta.meta_key = :fileKey', {
//       fileKey: '_wp_attached_file',
//     })
//     .where('article.post_status = :status', { status: 'publish' });

//   if (categoryId) {
//     qb.innerJoin('wp_term_relationships', 'tr', 'tr.object_id = article.ID')
//       .innerJoin('wp_term_taxonomy', 'tt', 'tt.term_taxonomy_id = tr.term_taxonomy_id')
//       .andWhere('tt.taxonomy = :taxonomy', { taxonomy: 'category' })
//       .andWhere('tt.term_id = :categoryId', { categoryId });
//   }

//   qb.orderBy('article.post_date', 'DESC')
//     .offset(offset)
//     .limit(limit);

//   const articles = await qb.getRawMany();

//   const countQb = this.dataSource
//     .createQueryBuilder()
//     .select('COUNT(*)', 'count')
//     .from(Article, 'article')
//     .where('article.post_status = :status', { status: 'publish' });

//   if (categoryId) {
//     countQb
//       .innerJoin('wp_term_relationships', 'tr', 'tr.object_id = article.ID')
//       .innerJoin('wp_term_taxonomy', 'tt', 'tt.term_taxonomy_id = tr.term_taxonomy_id')
//       .andWhere('tt.taxonomy = :taxonomy', { taxonomy: 'category' })
//       .andWhere('tt.term_id = :categoryId', { categoryId });
//   }

//   const totalResult = await countQb.getRawOne();
//   const total = parseInt(totalResult.count, 10);

//   const appUrl = process.env.APP_URL || 'https://xibarubamback.onrender.com';

//   // Format articles and add categories for each
//   const formattedArticles = await Promise.all(
//     articles.map(async (item: any) => {
//       // Get categories for each article
//       const categories = await this.getCategoriesByArticle(item.id);
      
//       return {
//         id: item.id,
//         title: item.title,
//         excerpt: item.excerpt,
//         content: item.content,
//         slug: item.slug,
//         date: item.date,
//         image: item.image ? `${appUrl}/uploads/${item.image}` : null,
//         categories: categories, // Add categories here
//       };
//     })
//   );

//   return {
//     articles: formattedArticles,
//     total,
//     totalPages: Math.ceil(total / limit),
//     articlesCount: formattedArticles.length,
//     firstArticle: formattedArticles[0] || null,
//     firstArticleImage: formattedArticles[0]?.image || null,
//   };
// }
//   async findDrafts() {
//     return this.articleRepo.find({
//       where: { postStatus: 'draft' },
//       order: { postModified: 'DESC' },
//     });
//   }

//   async findByStatus(status: string) {
//     return this.articleRepo.find({
//       where: { postStatus: status },
//       order: { postDate: 'DESC' },
//     });
//   }

//   async updateStatus(id: number, status: string) {
//     const article = await this.articleRepo.findOneBy({ ID: id });
//     if (!article) throw new NotFoundException('Article non trouvé');

//     article.postStatus = status;
//     article.postModified = new Date();
//     article.postModifiedGmt = new Date();

//     return this.articleRepo.save(article);
//   }

//   async findWithPagination(page: number, limit: number) {
//     const offset = (page - 1) * limit;

//     const articles = await this.dataSource
//       .createQueryBuilder()
//       .select([
//         'article.ID AS id',
//         'article.post_title AS title',
//         'article.post_excerpt AS excerpt',
//         'article.post_content AS content',
//         'article.post_date AS postDate',
//         'article.post_name AS slug',
//         'article.post_status AS postStatus',
//         'article.post_type AS postType',
//         'article.guid AS guid',
//         'article.post_author AS postAuthor',
//         'media.meta_value AS image'
//       ])
//       .from(Article, 'article')
//       .leftJoin(MediaMeta, 'media', 'media.post_id = article.ID AND media.meta_key = "_wp_attached_file"')
//       .where('article.post_status = :status', { status: 'publish' })
//       .orderBy('article.post_date', 'DESC')
//       .offset(offset)
//       .limit(limit)
//       .getRawMany();

//     const appUrl = process.env.APP_URL || 'https://xibarubamback.onrender.com';

//     articles.forEach((article: any) => { // Fixed: added type annotation
//       if (article.image) {
//         article.image = `${appUrl}/uploads/${article.image}`;
//       } else {
//         article.image = null; 
//       }
//     });

//     const total = await this.dataSource
//       .createQueryBuilder()
//       .select('COUNT(*)', 'count')
//       .from(Article, 'article')
//       .where('article.post_status = :status', { status: 'publish' })
//       .getRawOne();

//     const totalPages = Math.ceil(total.count / limit);

//     return {
//       articles,
//       total: parseInt(total.count, 10),
//       totalPages: totalPages || 1
//     };
//   }

//   async searchArticles(query: string, page = 1, limit = 10) {
//     const offset = (page - 1) * limit;

//     const articles = await this.articleRepo
//       .createQueryBuilder('article')
//       .where('article.post_title LIKE :searchTerm', {
//         searchTerm: `%${query}%`,
//       })
//       .andWhere('article.post_status = :status', { status: 'publish' })
//       .andWhere('article.post_type = :type', { type: 'post' })
//       .orderBy('article.post_date', 'DESC')
//       .offset(offset)
//       .limit(limit)
//       .getMany();

//     const total = await this.articleRepo
//       .createQueryBuilder('article')
//       .where('article.post_title LIKE :searchTerm', {
//         searchTerm: `%${query}%`,
//       })
//       .andWhere('article.post_status = :status', { status: 'publish' })
//       .andWhere('article.post_type = :type', { type: 'post' })
//       .getCount();

//     const appUrl = process.env.APP_URL || 'https://xibarubamback.onrender.com';

//     const enrichedArticles = await Promise.all(
//       articles.map(async (article) => {
//         const imageMeta = await this.dataSource
//           .createQueryBuilder()
//           .select('file_meta.meta_value', 'image')
//           .from('wp_postmeta', 'thumb_meta')
//           .leftJoin(
//             'wp_postmeta',
//             'file_meta',
//             'file_meta.post_id = thumb_meta.meta_value AND file_meta.meta_key = :fileKey',
//             { fileKey: '_wp_attached_file' }
//           )
//           .where('thumb_meta.post_id = :postId', { postId: article.ID })
//           .andWhere('thumb_meta.meta_key = :thumbnailKey', { thumbnailKey: '_thumbnail_id' })
//           .getRawOne();

//         // const imageUrl = imageMeta?.image ? `${appUrl}/uploads/${imageMeta.image}` : null;
//         const imageUrl = imageMeta?.cloud_url || imageMeta?.guid || null;


//         const categories = await this.getCategoriesByArticle(article.ID);

//         return {
//           id: article.ID,
//           title: article.postTitle,
//           excerpt: article.postExcerpt,
//           content: article.postContent,
//           slug: article.postName,
//           date: article.postDate,
//           image: imageUrl,
//           categories,
//         };
//       })
//     );

//     return {
//       articles: enrichedArticles,
//       total,
//       totalPages: Math.ceil(total / limit),
//     };
//   }
// }

import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Article } from './article.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MediaMeta } from 'src/media/media.entity';
import { DataSource } from 'typeorm';
import { User } from 'src/user/user.entity';
import { CreateArticleDto } from 'src/dtos/create-article.dto';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
    private readonly dataSource: DataSource,
  ) { }

  async findPublic() {
    const articles = await this.articleRepo.find({
      where: {
        postType: 'post',
        postStatus: 'publish',
      },
      order: {
        postDate: 'DESC',
      },
    });

    const authorIds = [...new Set(articles.map(a => a.postAuthor).filter(id => id !== 0))];

    const authors = await this.dataSource
      .getRepository(User)
      .findByIds(authorIds);

    const articlesWithAuthors = articles.map(article => ({
      ...article,
      author: article.postAuthor === 0 ? null : authors.find(u => u.ID === article.postAuthor) || null,
    }));

    return articlesWithAuthors;
  }

  async findBySlug(slug: string) {
    const article = await this.articleRepo.findOneBy({
      postName: slug,
      postStatus: 'publish'
    });

    if (!article) {
      console.log('Article non trouvé pour ce slug:', slug);
      throw new NotFoundException('Article non trouvé');
    }

    console.log('=== RECHERCHE IMAGE POUR ARTICLE ===');
    console.log('Article ID:', article.ID);

    // Modification: récupérer l'URL Cloudinary depuis la métadonnée cloud_url
    const imageMeta = await this.dataSource
      .createQueryBuilder()
      .select([
        'file_meta.meta_value AS image_path',
        'cloud_meta.meta_value AS cloud_url'
      ])
      .from('wp_postmeta', 'thumb_meta')
      .leftJoin('wp_postmeta', 'file_meta', 'file_meta.post_id = thumb_meta.meta_value AND file_meta.meta_key = :fileKey', { fileKey: '_wp_attached_file' })
      .leftJoin('wp_postmeta', 'cloud_meta', 'cloud_meta.post_id = thumb_meta.meta_value AND cloud_meta.meta_key = :cloudKey', { cloudKey: 'cloud_url' })
      .where('thumb_meta.post_id = :postId', { postId: article.ID })
      .andWhere('thumb_meta.meta_key = :thumbnailKey', { thumbnailKey: '_thumbnail_id' })
      .getRawOne();

    console.log('Métadonnées image trouvées:', imageMeta);

    // Utiliser l'URL Cloudinary en priorité, sinon fallback sur l'ancien système
    const imageUrl = imageMeta?.cloud_url || (imageMeta?.image_path ? `${process.env.APP_URL || 'https://xibarubamback.onrender.com'}/uploads/${imageMeta.image_path}` : null);

    console.log('URL finale de l\'image:', imageUrl);

    const categories = await this.getCategoriesByArticle(article.ID);

    return {
      ...article,
      image: imageUrl,
      categories,
    };
  }

  async getCategoriesByArticle(articleId: number) {
    const categories = await this.dataSource
      .createQueryBuilder()
      .select('t.term_id', 'term_id')
      .addSelect('t.name', 'name')
      .addSelect('t.slug', 'slug')
      .from('wp_term_relationships', 'tr')
      .innerJoin('wp_term_taxonomy', 'tt', 'tt.term_taxonomy_id = tr.term_taxonomy_id')
      .innerJoin('wp_terms', 't', 't.term_id = tt.term_id')
      .where('tr.object_id = :articleId', { articleId })
      .andWhere('tt.taxonomy = :taxonomy', { taxonomy: 'category' })
      .getRawMany();

    const mappedCategories = categories.map(cat => ({
      id: cat.term_id,
      term_id: cat.term_id,
      name: cat.name,
      slug: cat.slug
    }));

    return mappedCategories;
  }

  async create(createArticleDto: CreateArticleDto) {
    const { 
      postTitle, 
      postContent, 
      postExcerpt = '', 
      postStatus = 'draft', 
      postName,
      thumbnailId,
      cloudinaryUrl // Nouveau: URL Cloudinary au lieu d'imagePath
    } = createArticleDto;

    if (!postTitle) throw new Error('postTitle is required');
    if (!postContent) throw new Error('postContent is required');

    const slug = postName || this.slugify(postTitle);

    // Créer l'article
    const article = this.articleRepo.create({
      postTitle,
      postContent,
      postExcerpt,
      postStatus,
      postName: slug,
      postType: 'post',
      postDate: new Date(),
      postDateGmt: new Date(),
      postModified: new Date(),
      postModifiedGmt: new Date(),
      guid: '', 
      commentStatus: 'open',
      pingStatus: 'open',
      postPassword: '',
      toPing: '',
      pinged: '',
      postContentFiltered: '',
      postParent: 0,
      menuOrder: 0,
      postMimeType: '',
      commentCount: 0,
      postAuthor: 0,
    });

    const savedArticle = await this.articleRepo.save(article);

    const appUrl = process.env.APP_URL || 'https://xibarubamback.onrender.com';
    savedArticle.guid = `${appUrl}/?p=${savedArticle.ID}`;

    await this.articleRepo.save(savedArticle);

    // Si une image Cloudinary est fournie, l'associer à l'article
    if (thumbnailId) {
      await this.attachImageToArticle(savedArticle.ID, thumbnailId);
    }

    // Si une URL Cloudinary est fournie, créer l'entrée image et l'associer
    if (cloudinaryUrl) {
      console.log('Traitement de l\'image Cloudinary:', cloudinaryUrl);
      
      // Extraire le nom du fichier de l'URL Cloudinary
      const fileName = this.extractFileNameFromCloudinaryUrl(cloudinaryUrl);
      console.log('Nom du fichier extrait:', fileName);

      // Créer l'entrée d'image avec l'URL Cloudinary
      const imageId = await this.createCloudinaryImagePost(cloudinaryUrl, fileName);
      console.log('ID de l\'image créée:', imageId);

      // Associer l'image à l'article
      await this.attachImageToArticle(savedArticle.ID, imageId);
      console.log('Image associée à l\'article:', savedArticle.ID);
    }

    return savedArticle;
  }

  // Nouvelle méthode pour créer une entrée d'image Cloudinary dans wp_posts
  async createCloudinaryImagePost(cloudinaryUrl: string, fileName: string): Promise<number> {
    const imagePost = this.articleRepo.create({
      postTitle: fileName,
      postContent: '',
      postExcerpt: '',
      postStatus: 'inherit',
      postName: this.slugify(fileName),
      postType: 'attachment',
      postDate: new Date(),
      postDateGmt: new Date(),
      postModified: new Date(),
      postModifiedGmt: new Date(),
      guid: cloudinaryUrl, // Utiliser l'URL Cloudinary comme GUID
      commentStatus: 'open',
      pingStatus: 'closed',
      postPassword: '',
      toPing: '',
      pinged: '',
      postContentFiltered: '',
      postParent: 0,
      menuOrder: 0,
      postMimeType: this.getMimeTypeFromUrl(cloudinaryUrl),
      commentCount: 0,
      postAuthor: 0,
    });

    const savedImagePost = await this.articleRepo.save(imagePost);

    // Ajouter les métadonnées de l'image Cloudinary
    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into('wp_postmeta')
      .values([
        {
          post_id: savedImagePost.ID,
          meta_key: 'cloud_url',
          meta_value: cloudinaryUrl
        },
        {
          post_id: savedImagePost.ID,
          meta_key: '_wp_attached_file',
          meta_value: fileName // Garder le nom du fichier pour compatibilité
        }
      ])
      .execute();

    return savedImagePost.ID;
  }

  // Méthode pour extraire le nom du fichier d'une URL Cloudinary
  private extractFileNameFromCloudinaryUrl(url: string): string {
    try {
      // URL Cloudinary format: https://res.cloudinary.com/daepsasbx/image/upload/v1234567890/folder/filename.ext
      const urlParts = url.split('/');
      const fileNameWithExt = urlParts[urlParts.length - 1];
      return fileNameWithExt || 'cloudinary-image';
    } catch (error) {
      return 'cloudinary-image';
    }
  }

  // Méthode pour obtenir le type MIME à partir de l'URL
  private getMimeTypeFromUrl(url: string): string {
    const fileName = this.extractFileNameFromCloudinaryUrl(url);
    return this.getMimeType(fileName);
  }

  // Méthode pour associer une image à un article (inchangée)
  async attachImageToArticle(articleId: number, imageId: number): Promise<void> {
    console.log('=== ASSOCIATION IMAGE À L\'ARTICLE ===');
    console.log('Article ID:', articleId);
    console.log('Image ID:', imageId);
    
    try {
      const result = await this.dataSource
        .createQueryBuilder()
        .insert()
        .into('wp_postmeta')
        .values({
          post_id: articleId,
          meta_key: '_thumbnail_id',
          meta_value: imageId.toString()
        })
        .execute();
      
      console.log('Résultat de l\'insertion thumbnail:', result);
      
      // Vérifier que l'insertion a bien eu lieu
      const verification = await this.dataSource
        .createQueryBuilder()
        .select('*')
        .from('wp_postmeta', 'meta')
        .where('meta.post_id = :postId', { postId: articleId })
        .andWhere('meta.meta_key = :metaKey', { metaKey: '_thumbnail_id' })
        .getRawOne();
        
      console.log('Vérification thumbnail dans la base:', verification);
    } catch (error) {
      console.error('Erreur lors de l\'association image:', error);
      throw error;
    }
  }

  // Méthode pour obtenir le type MIME d'un fichier (inchangée)
  private getMimeType(fileName: string): string {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (!extension) return 'application/octet-stream';
    
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }

  // Méthode modifiée pour créer un article avec image Cloudinary
  async createWithImage(createArticleDto: CreateArticleDto, cloudinaryUrl?: string): Promise<any> {
    // Créer l'article d'abord avec l'URL Cloudinary
    const articleWithCloudinary = {
      ...createArticleDto,
      cloudinaryUrl: cloudinaryUrl
    };
    
    const article = await this.create(articleWithCloudinary);

    // Retourner l'article avec l'image
    return this.findBySlug(article.postName);
  }

  private slugify(title: string): string {
    return title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')      
      .replace(/[^\w\-]+/g, ''); 
  }

  async update(id: number, data: Partial<Article>) {
    await this.articleRepo.update(id, data);
    return this.articleRepo.findOneBy({ ID: id });
  }

  async delete(id: number) {
    await this.articleRepo.delete(id);
  }

  async publish(id: number) {
    const article = await this.articleRepo.findOneBy({ ID: id });
    if (!article) throw new NotFoundException('Article non trouvé');
    article.postStatus = 'publish';
    article.postModified = new Date();
    article.postModifiedGmt = new Date();
    return this.articleRepo.save(article);
  }

  async findAll() {
    return this.articleRepo.find({
      order: {
        postDate: 'DESC',
      },
    });
  }

  async findByType(postType: string) {
    return this.articleRepo.find({
      where: { postType },
      order: { postDate: 'DESC' },
    });
  }

  async findByAuthor(authorId: number) {
    return this.articleRepo.find({
      where: { postAuthor: authorId },
      order: { postDate: 'DESC' },
    });
  }

  async findArticlesWithImagesMerged(page: number, limit: number, categoryId?: number) {
    const offset = (page - 1) * limit;

    const qb = this.dataSource
      .createQueryBuilder()
      .select([
        'article.ID AS id',
        'article.post_title AS title',
        'article.post_excerpt AS excerpt',
        'article.post_content AS content',
        'article.post_date AS date',
        'article.post_name AS slug',
        'file_meta.meta_value AS image_path',
        'cloud_meta.meta_value AS cloud_url', // Ajout de l'URL Cloudinary
      ])
      .from(Article, 'article')
      .leftJoin('wp_postmeta', 'thumb_meta', 'thumb_meta.post_id = article.ID AND thumb_meta.meta_key = :thumbnailKey', {
        thumbnailKey: '_thumbnail_id',
      })
      .leftJoin('wp_postmeta', 'file_meta', 'file_meta.post_id = thumb_meta.meta_value AND file_meta.meta_key = :fileKey', {
        fileKey: '_wp_attached_file',
      })
      .leftJoin('wp_postmeta', 'cloud_meta', 'cloud_meta.post_id = thumb_meta.meta_value AND cloud_meta.meta_key = :cloudKey', {
        cloudKey: 'cloud_url',
      })
      .where('article.post_status = :status', { status: 'publish' });

    if (categoryId) {
      qb.innerJoin('wp_term_relationships', 'tr', 'tr.object_id = article.ID')
        .innerJoin('wp_term_taxonomy', 'tt', 'tt.term_taxonomy_id = tr.term_taxonomy_id')
        .andWhere('tt.taxonomy = :taxonomy', { taxonomy: 'category' })
        .andWhere('tt.term_id = :categoryId', { categoryId });
    }

    qb.orderBy('article.post_date', 'DESC')
      .offset(offset)
      .limit(limit);

    const articles = await qb.getRawMany();

    const countQb = this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from(Article, 'article')
      .where('article.post_status = :status', { status: 'publish' });

    if (categoryId) {
      countQb
        .innerJoin('wp_term_relationships', 'tr', 'tr.object_id = article.ID')
        .innerJoin('wp_term_taxonomy', 'tt', 'tt.term_taxonomy_id = tr.term_taxonomy_id')
        .andWhere('tt.taxonomy = :taxonomy', { taxonomy: 'category' })
        .andWhere('tt.term_id = :categoryId', { categoryId });
    }

    const totalResult = await countQb.getRawOne();
    const total = parseInt(totalResult.count, 10);

    const appUrl = process.env.APP_URL || 'https://xibarubamback.onrender.com';

    // Format articles and add categories for each
    const formattedArticles = await Promise.all(
      articles.map(async (item: any) => {
        // Get categories for each article
        const categories = await this.getCategoriesByArticle(item.id);
        
        // Utiliser l'URL Cloudinary en priorité
        const imageUrl = item.cloud_url || (item.image_path ? `${appUrl}/uploads/${item.image_path}` : null);
        
        return {
          id: item.id,
          title: item.title,
          excerpt: item.excerpt,
          content: item.content,
          slug: item.slug,
          date: item.date,
          image: imageUrl,
          categories: categories,
        };
      })
    );

    return {
      articles: formattedArticles,
      total,
      totalPages: Math.ceil(total / limit),
      articlesCount: formattedArticles.length,
      firstArticle: formattedArticles[0] || null,
      firstArticleImage: formattedArticles[0]?.image || null,
    };
  }

  async findDrafts() {
    return this.articleRepo.find({
      where: { postStatus: 'draft' },
      order: { postModified: 'DESC' },
    });
  }

  async findByStatus(status: string) {
    return this.articleRepo.find({
      where: { postStatus: status },
      order: { postDate: 'DESC' },
    });
  }

  async updateStatus(id: number, status: string) {
    const article = await this.articleRepo.findOneBy({ ID: id });
    if (!article) throw new NotFoundException('Article non trouvé');

    article.postStatus = status;
    article.postModified = new Date();
    article.postModifiedGmt = new Date();

    return this.articleRepo.save(article);
  }

  async findWithPagination(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const articles = await this.dataSource
      .createQueryBuilder()
      .select([
        'article.ID AS id',
        'article.post_title AS title',
        'article.post_excerpt AS excerpt',
        'article.post_content AS content',
        'article.post_date AS postDate',
        'article.post_name AS slug',
        'article.post_status AS postStatus',
        'article.post_type AS postType',
        'article.guid AS guid',
        'article.post_author AS postAuthor',
        'media.meta_value AS image_path',
        'cloud_meta.meta_value AS cloud_url' // Ajout de l'URL Cloudinary
      ])
      .from(Article, 'article')
      .leftJoin(MediaMeta, 'media', 'media.post_id = article.ID AND media.meta_key = "_wp_attached_file"')
      .leftJoin('wp_postmeta', 'cloud_meta', 'cloud_meta.post_id = article.ID AND cloud_meta.meta_key = "cloud_url"')
      .where('article.post_status = :status', { status: 'publish' })
      .orderBy('article.post_date', 'DESC')
      .offset(offset)
      .limit(limit)
      .getRawMany();

    const appUrl = process.env.APP_URL || 'https://xibarubamback.onrender.com';

    articles.forEach((article: any) => {
      // Utiliser l'URL Cloudinary en priorité
      if (article.cloud_url) {
        article.image = article.cloud_url;
      } else if (article.image_path) {
        article.image = `${appUrl}/uploads/${article.image_path}`;
      } else {
        article.image = null; 
      }
    });

    const total = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'count')
      .from(Article, 'article')
      .where('article.post_status = :status', { status: 'publish' })
      .getRawOne();

    const totalPages = Math.ceil(total.count / limit);

    return {
      articles,
      total: parseInt(total.count, 10),
      totalPages: totalPages || 1
    };
  }

  async searchArticles(query: string, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const articles = await this.articleRepo
      .createQueryBuilder('article')
      .where('article.post_title LIKE :searchTerm', {
        searchTerm: `%${query}%`,
      })
      .andWhere('article.post_status = :status', { status: 'publish' })
      .andWhere('article.post_type = :type', { type: 'post' })
      .orderBy('article.post_date', 'DESC')
      .offset(offset)
      .limit(limit)
      .getMany();

    const total = await this.articleRepo
      .createQueryBuilder('article')
      .where('article.post_title LIKE :searchTerm', {
        searchTerm: `%${query}%`,
      })
      .andWhere('article.post_status = :status', { status: 'publish' })
      .andWhere('article.post_type = :type', { type: 'post' })
      .getCount();

    const enrichedArticles = await Promise.all(
      articles.map(async (article) => {
        const imageMeta = await this.dataSource
          .createQueryBuilder()
          .select([
            'file_meta.meta_value AS image_path',
            'cloud_meta.meta_value AS cloud_url'
          ])
          .from('wp_postmeta', 'thumb_meta')
          .leftJoin(
            'wp_postmeta',
            'file_meta',
            'file_meta.post_id = thumb_meta.meta_value AND file_meta.meta_key = :fileKey',
            { fileKey: '_wp_attached_file' }
          )
          .leftJoin(
            'wp_postmeta',
            'cloud_meta',
            'cloud_meta.post_id = thumb_meta.meta_value AND cloud_meta.meta_key = :cloudKey',
            { cloudKey: 'cloud_url' }
          )
          .where('thumb_meta.post_id = :postId', { postId: article.ID })
          .andWhere('thumb_meta.meta_key = :thumbnailKey', { thumbnailKey: '_thumbnail_id' })
          .getRawOne();

        // Utiliser l'URL Cloudinary en priorité
        const imageUrl = imageMeta?.cloud_url || (imageMeta?.image_path ? `${process.env.APP_URL || 'https://xibarubamback.onrender.com'}/uploads/${imageMeta.image_path}` : null);

        const categories = await this.getCategoriesByArticle(article.ID);

        return {
          id: article.ID,
          title: article.postTitle,
          excerpt: article.postExcerpt,
          content: article.postContent,
          slug: article.postName,
          date: article.postDate,
          image: imageUrl,
          categories,
        };
      })
    );

    return {
      articles: enrichedArticles,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }
}