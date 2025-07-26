import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { Category } from './category.entity';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // Route : GET /categories
  @Get()
  findAll(): Promise<Category[]> {
    return this.categoryService.findAll();
  }

  // Route : GET /categories/formatted
  @Get('formatted')
  findAllFormatted(): Promise<any[]> {
    return this.categoryService.findAllFormatted();
  }

  // Route : GET /categories/:id
  @Get(':id')
  findOne(@Param('id') id: number): Promise<Category> {
    return this.categoryService.findOne(+id);
  }

  // Route : POST /categories
  @Post()
  create(@Body() categoryData: Partial<Category>): Promise<Category> {
    return this.categoryService.create(categoryData);
  }

  // Route : PUT /categories/:id
  @Put(':id')
  update(
    @Param('id') id: number,
    @Body() categoryData: Partial<Category>,
  ): Promise<Category> {
    return this.categoryService.update(+id, categoryData);
  }

  @Delete(':id')
  remove(@Param('id') id: number): Promise<void> {
    return this.categoryService.remove(+id);
  }
}
