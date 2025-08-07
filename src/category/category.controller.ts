
import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { CategoryService } from './category.service';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  getCategories() {
    return this.categoryService.findAll();
  }

  @Get(':slug')
  getCategoryBySlug(@Param('slug') slug: string) {
    return this.categoryService.findBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createCategory(@Body() data) {
    return this.categoryService.create(data);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  updateCategory(@Param('id') id: string, @Body() data) {
    return this.categoryService.update(+id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteCategory(@Param('id') id: string) {
    return this.categoryService.delete(+id);
  }
}
