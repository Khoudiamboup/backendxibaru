import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from './article.entity';

@Injectable()
export class ArticleService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
  ) {}

  findAll(): Promise<Article[]> {
    return this.articleRepo.find({ relations: ['category', 'author'] });
  }

  async findOne(id: number): Promise<Article> {
    const article = await this.articleRepo.findOne({
      where: { id },
      relations: ['category', 'author'],
    });

    if (!article) {
      throw new NotFoundException('Article not found');
    }

    return article;
  }

  create(articleData: Partial<Article>): Promise<Article> {
    const article = this.articleRepo.create(articleData);
    return this.articleRepo.save(article);
  }

  async update(id: number, articleData: Partial<Article>): Promise<Article> {
    const article = await this.findOne(id);
    Object.assign(article, articleData);
    return this.articleRepo.save(article);
  }

  async remove(id: number): Promise<void> {
    await this.articleRepo.delete(id);
  }
}
