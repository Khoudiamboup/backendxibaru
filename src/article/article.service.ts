import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Article } from './article.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MediaMeta } from 'src/media/media.entity';
import { DataSource } from 'typeorm';
import { User } from 'src/user/user.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
     private readonly dataSource: DataSource, 

  ) {}

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

  // Récupérer les auteurs pour postAuthor != 0
  const authorIds = [...new Set(articles.map(a => a.postAuthor).filter(id => id !== 0))];

  const authors = await this.dataSource
    .getRepository(User)
    .findByIds(authorIds);

  // Mapper les auteurs aux articles
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

  
  const imageMeta = await this.dataSource
    .createQueryBuilder()
    .select('file_meta.meta_value', 'image')
    .from('wp_postmeta', 'thumb_meta')
    .leftJoin('wp_postmeta', 'file_meta', 'file_meta.post_id = thumb_meta.meta_value AND file_meta.meta_key = :fileKey', { fileKey: '_wp_attached_file' })
    .where('thumb_meta.post_id = :postId', { postId: article.ID })
    .andWhere('thumb_meta.meta_key = :thumbnailKey', { thumbnailKey: '_thumbnail_id' })
    .getRawOne();

  const appUrl = process.env.APP_URL || 'http://localhost:3001';
  const imageUrl = imageMeta?.image ? `${appUrl}/uploads/${imageMeta.image}` : null;

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
    .select('t.term_id', 'id')
    .addSelect('t.name', 'name')
    .addSelect('t.slug', 'slug')
    .from('wp_term_relationships', 'tr')
    .innerJoin('wp_term_taxonomy', 'tt', 'tt.term_taxonomy_id = tr.term_taxonomy_id')
    .innerJoin('wp_terms', 't', 't.term_id = tt.term_id')
    .where('tr.object_id = :articleId', { articleId })
    .andWhere('tt.taxonomy = :taxonomy', { taxonomy: 'category' })
    .getRawMany();

  return categories;
}



  async create(data) {
    const article = this.articleRepo.create(data);
    return this.articleRepo.save(article);
  }

  async update(id: number, data) {
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
     // relations: ['author'], // À décommenter si vous ajoutez la relation avec User
      order: {
        postDate: 'DESC',
      },
    });
  }

  // Méthodes supplémentaires utiles pour WordPress
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

  // Création du query builder
  const qb = this.dataSource
    .createQueryBuilder()
    .select([
      'article.ID AS id',
      'article.post_title AS title',
      'article.post_excerpt AS excerpt',
      'article.post_content AS content',
      'article.post_date AS date',
      'article.post_name AS slug',
      'file_meta.meta_value AS image',
    ])
    .from(Article, 'article')
    .leftJoin('wp_postmeta', 'thumb_meta', 'thumb_meta.post_id = article.ID AND thumb_meta.meta_key = :thumbnailKey', {
      thumbnailKey: '_thumbnail_id',
    })
    .leftJoin('wp_postmeta', 'file_meta', 'file_meta.post_id = thumb_meta.meta_value AND file_meta.meta_key = :fileKey', {
      fileKey: '_wp_attached_file',
    })
    .where('article.post_status = :status', { status: 'publish' });

  // Ajoute le filtre si categoryId est fourni
  if (categoryId) {
    qb.innerJoin('wp_term_relationships', 'tr', 'tr.object_id = article.ID')
      .innerJoin('wp_term_taxonomy', 'tt', 'tt.term_taxonomy_id = tr.term_taxonomy_id')
      .andWhere('tt.taxonomy = :taxonomy', { taxonomy: 'category' })
      .andWhere('tt.term_id = :categoryId', { categoryId });
  }

  // Pagination et tri
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

  const totalResult = await countQb.setParameters({ categoryId }).getRawOne();
  const total = parseInt(totalResult.count, 10);

  const appUrl = process.env.APP_URL || 'http://localhost:3001';

  const formattedArticles = articles.map((item) => ({
    id: item.id,
    title: item.title,
    excerpt: item.excerpt,
    content: item.content,
    slug: item.slug,
    date: item.date,
    image: item.image ? `${appUrl}/uploads/${item.image}` : null,
  }));

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
        'media.meta_value AS image'
      ])
      .from(Article, 'article')
      .leftJoin(MediaMeta, 'media', 'media.post_id = article.ID AND media.meta_key = "_wp_attached_file"')
      .where('article.post_status = :status', { status: 'publish' })
      .orderBy('article.post_date', 'DESC')
      .offset(offset)
      .limit(limit)
      .getRawMany();

    // Ajouter l'URL complète de l'image
    const appUrl = process.env.APP_URL || 'http://localhost:3001';

    articles.forEach(article => {
      if (article.image) {
        article.image = `${appUrl}/uploads/${article.image}`;
      } else {
        article.image = null; // ou un placeholder si tu veux directement ici
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

  async searchByTitle(searchTerm: string) {
    return this.articleRepo
      .createQueryBuilder('article')
      .where('article.postTitle LIKE :searchTerm', { 
        searchTerm: `%${searchTerm}%` 
      })
      .andWhere('article.postStatus = :status', { status: 'publish' })
      .andWhere('article.postType = :type', { type: 'post' })
      .orderBy('article.postDate', 'DESC')
      .getMany();
  }
}

