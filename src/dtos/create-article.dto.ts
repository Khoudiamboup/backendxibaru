import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from "class-validator";

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  excerpt?: string;

  @IsNumber()
  categoryId: number;

  @IsEnum(['draft', 'published'])
  @IsOptional()
  status?: string;
}
