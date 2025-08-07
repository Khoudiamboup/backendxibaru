// category.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from './category.entity';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Category])],  // <-- ✅ déclaration du repo
  providers: [CategoryService],
  controllers: [CategoryController],
  exports: [CategoryService],  // <-- pour permettre l'import dans d'autres modules
})
export class CategoryModule {}
