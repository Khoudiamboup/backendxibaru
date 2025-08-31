
// ========== DTO pour la mise à jour (optionnel) ==========

// Créez un nouveau fichier : src/dtos/update-article.dto.ts
import { IsOptional, IsString, IsIn } from 'class-validator';

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  postTitle?: string;

  @IsOptional()
  @IsString()
  postContent?: string;

  @IsOptional()
  @IsString()
  postExcerpt?: string;

  @IsOptional()
  @IsIn(['draft', 'publish', 'private', 'pending'])
  postStatus?: string;

  @IsOptional()
  @IsString()
  postName?: string;

  @IsOptional()
  @IsString()
  cloudinaryUrl?: string;
}
