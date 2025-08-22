import { IsOptional, IsString, IsNotEmpty, MinLength, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateArticleDto {
  @IsString({ message: 'Le titre doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le titre ne peut pas être vide' })
  @MinLength(1, { message: 'Le titre doit contenir au moins 1 caractère' })
  @Transform(({ value }) => {
    if (value === null || value === undefined) {
      return ''; 
    }
    return String(value).trim();
  })
  postTitle: string;

  @IsString({ message: 'Le contenu doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'Le contenu ne peut pas être vide' })
  @MinLength(1, { message: 'Le contenu doit contenir au moins 1 caractère' })
  @Transform(({ value }) => {
    if (value === null || value === undefined) {
      return ''; 
    }
    return String(value).trim();
  })
  postContent: string;

  

  @IsOptional()
  @IsString({ message: 'L\'extrait doit être une chaîne de caractères' })
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return '';
    return String(value).trim();
  })
  postExcerpt?: string;

 @IsOptional()
@IsString({ message: 'Le statut doit être une chaîne de caractères' })
postStatus?: string;

  @IsOptional()
  @IsString({ message: 'Le nom de l\'article doit être une chaîne de caractères' })
  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') return undefined;
    return String(value).trim();
  })
  postName?: string;

    @IsOptional()
  @IsNumber()
  thumbnailId?: number; // ID de l'image si elle existe déjà

  @IsOptional()
  @IsString()
  imagePath?: string; // Chemin vers l'image uploadée

}