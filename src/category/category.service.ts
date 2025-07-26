import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  findAll(): Promise<Category[]> {
    return this.categoryRepo.find({ relations: ['articles', 'parent'] });
  }

  async findOne(id: number): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      where: { id },
      relations: ['articles', 'parent'],
    });

    if (!category) {
      throw new NotFoundException(`Catégorie ${id} non trouvée`);
    }

    return category;
  }

  async create(data: Partial<Category>): Promise<Category> {
    const category = this.categoryRepo.create(data);
    return this.categoryRepo.save(category);
  }

  async update(id: number, data: Partial<Category>): Promise<Category> {
    const category = await this.findOne(id);
    Object.assign(category, data);
    return this.categoryRepo.save(category);
  }

  async remove(id: number): Promise<void> {
    await this.categoryRepo.delete(id);
  }

  // 🟡 Méthode personnalisée pour format enrichi
  async findAllFormatted(): Promise<any[]> {
    const categories = await this.categoryRepo.find({
      relations: ['articles', 'parent'],
    });

    return categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      count: category.articles?.length ?? 0,
      link: category.link,
      parent: category.parent ? {
        id: category.parent.id,
        name: category.parent.name,
      } : null,
    }));
  }
}
