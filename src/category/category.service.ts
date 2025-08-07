import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { Repository } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepo: Repository<Category>,
  ) {}

  async findAll() {
    return this.categoryRepo.find();
  }

 async findBySlug(slug: string) {
  const category = await this.categoryRepo.findOneBy({ slug });
  if (!category) throw new NotFoundException('Catégorie non trouvée');
  return category;
}


  async create(data) {
    const cat = this.categoryRepo.create(data);
    return this.categoryRepo.save(cat);
  }

  async update(id: number, data) {
  await this.categoryRepo.update(id, data);
  return this.categoryRepo.findOneBy({ term_id: id });
}


  async delete(id: number) {
    await this.categoryRepo.delete(id);
  }
}





