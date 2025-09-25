
import { IsString, IsOptional, IsNotEmpty, MaxLength, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Le titre est obligatoire' })
  @MaxLength(200, { message: 'Le titre ne peut pas dépasser 200 caractères' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  postTitle: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1, { message: 'Le contenu est obligatoire' })
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  postContent: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  postExcerpt?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  postStatus?: 'draft' | 'publish' | 'private';

  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  postName?: string;

  @IsOptional()
  thumbnailId?: number;

  // Nouvelle propriété pour l'URL Cloudinary
  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  cloudinaryUrl?: string;

  // Propriété dépréciée (pour compatibilité descendante)
  @IsOptional()
  @IsString()
  @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
  imagePath?: string;
}