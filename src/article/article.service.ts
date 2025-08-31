
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

  async updateWithImage(
  id: number, 
  updateData: Partial<CreateArticleDto>, 
  cloudinaryUrl?: string
): Promise<any> {
  console.log('=== MISE À JOUR ARTICLE AVEC IMAGE ===');
  console.log('ID:', id);
  console.log('Données de mise à jour:', updateData);
  console.log('URL Cloudinary:', cloudinaryUrl);

  // Vérifier que l'article existe
  const existingArticle = await this.articleRepo.findOneBy({ ID: id });
  if (!existingArticle) {
    throw new NotFoundException('Article non trouvé');
  }

  // Préparer les données de mise à jour
  const updatePayload: Partial<Article> = {
    postModified: new Date(),
    postModifiedGmt: new Date()
  };

  // Mapper les champs du DTO vers l'entité Article
  if (updateData.postTitle) {
    updatePayload.postTitle = updateData.postTitle.trim();
  }
  if (updateData.postContent) {
    updatePayload.postContent = updateData.postContent.trim();
  }
  if (updateData.postExcerpt !== undefined) {
    updatePayload.postExcerpt = updateData.postExcerpt.trim();
  }
  if (updateData.postStatus) {
    updatePayload.postStatus = updateData.postStatus.trim();
  }
  if (updateData.postName) {
    updatePayload.postName = this.slugify(updateData.postName);
  } else if (updateData.postTitle) {
    // Générer un nouveau slug si le titre change
    updatePayload.postName = this.slugify(updateData.postTitle);
  }

  // Mettre à jour l'article
  await this.articleRepo.update(id, updatePayload);

  // Gérer la mise à jour de l'image si une nouvelle URL Cloudinary est fournie
  if (cloudinaryUrl) {
    console.log('Mise à jour de l\'image Cloudinary...');
    await this.updateArticleImage(id, cloudinaryUrl);
  }

  // Retourner l'article mis à jour avec ses données complètes
  return this.findBySlug(updatePayload.postName || existingArticle.postName);
}

async updateArticleImage(articleId: number, cloudinaryUrl: string): Promise<void> {
  console.log('=== MISE À JOUR IMAGE ARTICLE ===');
  console.log('Article ID:', articleId);
  console.log('Nouvelle URL Cloudinary:', cloudinaryUrl);

  try {
    // 1. Récupérer l'ID de l'image actuelle (thumbnail_id) si elle existe
    const currentThumbnail = await this.dataSource
      .createQueryBuilder()
      .select('meta.meta_value', 'thumbnail_id')
      .from('wp_postmeta', 'meta')
      .where('meta.post_id = :postId', { postId: articleId })
      .andWhere('meta.meta_key = :metaKey', { metaKey: '_thumbnail_id' })
      .getRawOne();

    if (currentThumbnail?.thumbnail_id) {
      console.log('Image existante trouvée, ID:', currentThumbnail.thumbnail_id);
      
      // 2. Mettre à jour l'entrée d'image existante
      await this.updateImagePost(parseInt(currentThumbnail.thumbnail_id), cloudinaryUrl);
      
      // 3. Mettre à jour ou créer la métadonnée cloud_url
      await this.updateOrCreateCloudinaryMeta(parseInt(currentThumbnail.thumbnail_id), cloudinaryUrl);
      
    } else {
      console.log('Aucune image existante, création d\'une nouvelle...');
      
      // 4. Créer une nouvelle entrée d'image
      const fileName = this.extractFileNameFromCloudinaryUrl(cloudinaryUrl);
      const imageId = await this.createCloudinaryImagePost(cloudinaryUrl, fileName);
      
      // 5. Associer la nouvelle image à l'article
      await this.attachImageToArticle(articleId, imageId);
    }

    console.log('✅ Image mise à jour avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour de l\'image:', error);
    throw error;
  }
}

async updateImagePost(imageId: number, cloudinaryUrl: string): Promise<void> {
  const fileName = this.extractFileNameFromCloudinaryUrl(cloudinaryUrl);
  
  // Mettre à jour l'entrée wp_posts pour l'image
  await this.articleRepo.update(imageId, {
    guid: cloudinaryUrl,
    postTitle: fileName,
    postName: this.slugify(fileName),
    postModified: new Date(),
    postModifiedGmt: new Date(),
    postMimeType: this.getMimeTypeFromUrl(cloudinaryUrl)
  });

  console.log(`Image post ${imageId} mise à jour avec la nouvelle URL`);
}

async updateOrCreateCloudinaryMeta(imageId: number, cloudinaryUrl: string): Promise<void> {
  // Vérifier si la métadonnée cloud_url existe déjà
  const existingMeta = await this.dataSource
    .createQueryBuilder()
    .select('meta_id')
    .from('wp_postmeta', 'meta')
    .where('meta.post_id = :postId', { postId: imageId })
    .andWhere('meta.meta_key = :metaKey', { metaKey: 'cloud_url' })
    .getRawOne();

  if (existingMeta) {
    // Mettre à jour la métadonnée existante
    await this.dataSource
      .createQueryBuilder()
      .update('wp_postmeta')
      .set({ meta_value: cloudinaryUrl })
      .where('post_id = :postId', { postId: imageId })
      .andWhere('meta_key = :metaKey', { metaKey: 'cloud_url' })
      .execute();
    
    console.log(`Métadonnée cloud_url mise à jour pour l'image ${imageId}`);
  } else {
    // Créer une nouvelle métadonnée
    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into('wp_postmeta')
      .values({
        post_id: imageId,
        meta_key: 'cloud_url',
        meta_value: cloudinaryUrl
      })
      .execute();
    
    console.log(`Nouvelle métadonnée cloud_url créée pour l'image ${imageId}`);
  }

  // Mettre à jour aussi _wp_attached_file si nécessaire
  const fileName = this.extractFileNameFromCloudinaryUrl(cloudinaryUrl);
  const existingFile = await this.dataSource
    .createQueryBuilder()
    .select('meta_id')
    .from('wp_postmeta', 'meta')
    .where('meta.post_id = :postId', { postId: imageId })
    .andWhere('meta.meta_key = :metaKey', { metaKey: '_wp_attached_file' })
    .getRawOne();

  if (existingFile) {
    await this.dataSource
      .createQueryBuilder()
      .update('wp_postmeta')
      .set({ meta_value: fileName })
      .where('post_id = :postId', { postId: imageId })
      .andWhere('meta_key = :metaKey', { metaKey: '_wp_attached_file' })
      .execute();
  } else {
    await this.dataSource
      .createQueryBuilder()
      .insert()
      .into('wp_postmeta')
      .values({
        post_id: imageId,
        meta_key: '_wp_attached_file',
        meta_value: fileName
      })
      .execute();
  }
}

// Méthode utilitaire améliorée pour la mise à jour simple
async updateBasic(id: number, data: Partial<Article>): Promise<Article> {
  const article = await this.articleRepo.findOneBy({ ID: id });
  if (!article) {
    throw new NotFoundException('Article non trouvé');
  }

  // Ajouter les timestamps de modification
  const updateData = {
    ...data,
    postModified: new Date(),
    postModifiedGmt: new Date()
  };

  await this.articleRepo.update(id, updateData);
  
  const updatedArticle = await this.articleRepo.findOneBy({ ID: id });
  if (!updatedArticle) {
    throw new NotFoundException('Erreur lors de la récupération de l\'article mis à jour');
  }
  
  return updatedArticle;
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
// 1. D'abord, vérifiez les articles qui ont des images mais pas de cloud_url
async checkArticlesWithoutCloudinary() {
  const articlesWithImages = await this.dataSource
    .createQueryBuilder()
    .select([
      'p.ID as article_id',
      'p.post_title as title',
      'thumb.meta_value as thumbnail_id',
      'file.meta_value as image_path',
      'cloud.meta_value as cloud_url'
    ])
    .from('wp_posts', 'p')
    .innerJoin('wp_postmeta', 'thumb', 'thumb.post_id = p.ID AND thumb.meta_key = "_thumbnail_id"')
    .innerJoin('wp_postmeta', 'file', 'file.post_id = thumb.meta_value AND file.meta_key = "_wp_attached_file"')
    .leftJoin('wp_postmeta', 'cloud', 'cloud.post_id = thumb.meta_value AND cloud.meta_key = "cloud_url"')
    .where('p.post_type = :type', { type: 'post' })
    .andWhere('p.post_status = :status', { status: 'publish' })
    .getRawMany();

  console.log(`Total d'articles avec images: ${articlesWithImages.length}`);
  
  const withoutCloudinary = articlesWithImages.filter(a => !a.cloud_url);
  const withCloudinary = articlesWithImages.filter(a => a.cloud_url);
  
  console.log(`Articles SANS cloud_url: ${withoutCloudinary.length}`);
  console.log(`Articles AVEC cloud_url: ${withCloudinary.length}`);
  
  return {
    total: articlesWithImages.length,
    withCloudinary: withCloudinary.length,
    withoutCloudinary: withoutCloudinary.length,
    articlesWithoutCloudinary: withoutCloudinary.slice(0, 10) // Premiers 10 pour debug
  };
}

// 2. Fonction pour migrer les images vers Cloudinary
async migrateImagesToCloudinary() {
  // Récupérer tous les articles qui ont des images mais pas de cloud_url
  const articlesWithImages = await this.dataSource
    .createQueryBuilder()
    .select([
      'p.ID as article_id',
      'p.post_title as title',
      'thumb.meta_value as thumbnail_id',
      'file.meta_value as image_path'
    ])
    .from('wp_posts', 'p')
    .innerJoin('wp_postmeta', 'thumb', 'thumb.post_id = p.ID AND thumb.meta_key = "_thumbnail_id"')
    .innerJoin('wp_postmeta', 'file', 'file.post_id = thumb.meta_value AND file.meta_key = "_wp_attached_file"')
    .leftJoin('wp_postmeta', 'cloud', 'cloud.post_id = thumb.meta_value AND cloud.meta_key = "cloud_url"')
    .where('p.post_type = :type', { type: 'post' })
    .andWhere('p.post_status = :status', { status: 'publish' })
    .andWhere('cloud.meta_value IS NULL') // Seulement ceux sans cloud_url
    .getRawMany();

  console.log(`${articlesWithImages.length} articles à migrer vers Cloudinary`);

  const cloudinary = require('cloudinary').v2;
  
  // Configuration Cloudinary (assurez-vous d'avoir les bonnes variables d'environnement)
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  let successCount = 0;
  let errorCount = 0;

  for (const article of articlesWithImages) {
    try {
      console.log(`\n--- Traitement article ${article.article_id}: ${article.title} ---`);
      console.log(`Image path: ${article.image_path}`);
      
      // Construire le chemin complet vers l'image locale
      const imagePath = article.image_path;
      const localImagePath = `uploads/${imagePath}`;
      
      // Vérifier si le fichier existe localement
      const fs = require('fs');
      const path = require('path');
      const fullPath = path.join(process.cwd(), localImagePath);
      
      if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  Fichier non trouvé: ${fullPath}`);
        
        // Essayer avec l'URL complète si c'est déjà une URL
        if (imagePath.startsWith('http')) {
          console.log('Tentative d\'upload depuis URL existante...');
          const uploadResult = await cloudinary.uploader.upload(imagePath, {
            folder: 'articles/migrated',
            resource_type: 'auto',
            public_id: `article_${article.article_id}_${Date.now()}`
          });
          
          // Sauvegarder l'URL Cloudinary
          await this.dataSource
            .createQueryBuilder()
            .insert()
            .into('wp_postmeta')
            .values({
              post_id: parseInt(article.thumbnail_id),
              meta_key: 'cloud_url',
              meta_value: uploadResult.secure_url
            })
            .execute();
            
          console.log(`✅ Migration réussie depuis URL: ${uploadResult.secure_url}`);
          successCount++;
        } else {
          console.log('❌ Fichier introuvable et pas d\'URL valide');
          errorCount++;
        }
        continue;
      }

      // Upload vers Cloudinary
      const uploadResult = await cloudinary.uploader.upload(fullPath, {
        folder: 'articles/migrated',
        resource_type: 'auto',
        public_id: `article_${article.article_id}_${Date.now()}`
      });

      console.log(`✅ Upload réussi: ${uploadResult.secure_url}`);

      // Sauvegarder l'URL Cloudinary dans wp_postmeta
      await this.dataSource
        .createQueryBuilder()
        .insert()
        .into('wp_postmeta')
        .values({
          post_id: parseInt(article.thumbnail_id),
          meta_key: 'cloud_url',
          meta_value: uploadResult.secure_url
        })
        .execute();

      console.log(`💾 cloud_url sauvegardée pour thumbnail_id: ${article.thumbnail_id}`);
      successCount++;

    } catch (error) {
      console.error(`❌ Erreur pour l'article ${article.article_id}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n=== RÉSUMÉ DE LA MIGRATION ===');
  console.log(`✅ Succès: ${successCount}`);
  console.log(`❌ Erreurs: ${errorCount}`);
  console.log(`📊 Total traité: ${successCount + errorCount}`);

  return {
    success: successCount,
    errors: errorCount,
    total: successCount + errorCount
  };
}

// 3. Fonction pour convertir les anciennes URLs en URLs Cloudinary
async convertExistingUrlsToCloudinary() {
  // Pour les articles qui ont déjà des URLs complètes dans image_path
  const articlesWithFullUrls = await this.dataSource
    .createQueryBuilder()
    .select([
      'p.ID as article_id',
      'p.post_title as title', 
      'thumb.meta_value as thumbnail_id',
      'file.meta_value as image_path'
    ])
    .from('wp_posts', 'p')
    .innerJoin('wp_postmeta', 'thumb', 'thumb.post_id = p.ID AND thumb.meta_key = "_thumbnail_id"')
    .innerJoin('wp_postmeta', 'file', 'file.post_id = thumb.meta_value AND file.meta_key = "_wp_attached_file"')
    .leftJoin('wp_postmeta', 'cloud', 'cloud.post_id = thumb.meta_value AND cloud.meta_key = "cloud_url"')
    .where('p.post_type = :type', { type: 'post' })
    .andWhere('p.post_status = :status', { status: 'publish' })
    .andWhere('file.meta_value LIKE :urlPattern', { urlPattern: 'https://res.cloudinary.com%' })
    .andWhere('cloud.meta_value IS NULL')
    .getRawMany();

  console.log(`${articlesWithFullUrls.length} articles avec URLs Cloudinary dans image_path mais sans cloud_url`);

  let converted = 0;
  
  for (const article of articlesWithFullUrls) {
    try {
      // L'image_path contient déjà l'URL Cloudinary, il faut juste la copier dans cloud_url
      await this.dataSource
        .createQueryBuilder()
        .insert()
        .into('wp_postmeta')
        .values({
          post_id: parseInt(article.thumbnail_id),
          meta_key: 'cloud_url',
          meta_value: article.image_path
        })
        .execute();

      console.log(`✅ Converti article ${article.article_id}: ${article.image_path}`);
      converted++;
    } catch (error) {
      console.error(`❌ Erreur conversion article ${article.article_id}:`, error.message);
    }
  }

  console.log(`🎉 ${converted} URLs Cloudinary converties avec succès`);
  return { converted };
}

// 4. Méthode de correction temporaire pour votre ArticleService
async findBySlugWithFallback(slug: string) {
  const article = await this.articleRepo.findOneBy({
    postName: slug,
    postStatus: 'publish'
  });

  if (!article) {
    throw new NotFoundException('Article non trouvé');
  }

  // Récupération des métadonnées avec tous les cas possibles
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

  console.log(`Article ${article.ID} - Métadonnées:`, imageMeta);

  // Logique de fallback améliorée
  let imageUrl = null;
  
  if (imageMeta?.cloud_url) {
    // Cas 1: URL Cloudinary dans cloud_url (idéal)
    imageUrl = imageMeta.cloud_url;
    console.log('Utilisation cloud_url:', imageUrl);
  } else if (imageMeta?.image_path?.startsWith('https://res.cloudinary.com')) {
    // Cas 2: URL Cloudinary dans image_path (à migrer)
    imageUrl = imageMeta.image_path;
    console.log('URL Cloudinary trouvée dans image_path:', imageUrl);
  } else if (imageMeta?.image_path?.startsWith('http')) {
    // Cas 3: Autre URL complète
    imageUrl = imageMeta.image_path;
    console.log('URL complète dans image_path:', imageUrl);
  } else if (imageMeta?.image_path) {
    // Cas 4: Chemin relatif (ancien système)
    
  }

  const categories = await this.getCategoriesByArticle(article.ID);

  return {
    ...article,
    image: imageUrl,
    categories,
  };
}
  async updateStatus(id: number, status: string) {
    const article = await this.articleRepo.findOneBy({ ID: id });
    if (!article) throw new NotFoundException('Article non trouvé');

    article.postStatus = status;
    article.postModified = new Date();
    article.postModifiedGmt = new Date();

    return this.articleRepo.save(article);
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

  // Utiliser l'URL Cloudinary en priorité, sinon l'image_path tel quel
  const imageUrl = imageMeta?.cloud_url || imageMeta?.image_path || null;

  const categories = await this.getCategoriesByArticle(article.ID);

  return {
    ...article,
    image: imageUrl,
    categories,
  };
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
      'cloud_meta.meta_value AS cloud_url',
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

  const formattedArticles = await Promise.all(
    articles.map(async (item: any) => {
      const categories = await this.getCategoriesByArticle(item.id);
      
      // Utiliser l'URL Cloudinary en priorité, sinon l'image_path tel quel
      const imageUrl = item.cloud_url || item.image_path || null;
      
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
      'cloud_meta.meta_value AS cloud_url'
    ])
    .from(Article, 'article')
    .leftJoin(MediaMeta, 'media', 'media.post_id = article.ID AND media.meta_key = "_wp_attached_file"')
    .leftJoin('wp_postmeta', 'cloud_meta', 'cloud_meta.post_id = article.ID AND cloud_meta.meta_key = "cloud_url"')
    .where('article.post_status = :status', { status: 'publish' })
    .orderBy('article.post_date', 'DESC')
    .offset(offset)
    .limit(limit)
    .getRawMany();

  articles.forEach((article: any) => {
    // Utiliser l'URL Cloudinary en priorité, sinon l'image_path tel quel
    article.image = article.cloud_url || article.image_path || null;
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

      // Utiliser l'URL Cloudinary en priorité, sinon l'image_path tel quel
      const imageUrl = imageMeta?.cloud_url || imageMeta?.image_path || null;

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