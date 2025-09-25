import { IsOptional, IsString, IsIn, MaxLength, IsEmail } from 'class-validator';

export class UpdateCommentDto {
  @IsOptional()
  @IsString()
  @MaxLength(65535)
  comment_content?: string;

  @IsOptional()
  @IsString()
  @IsIn(['0', '1', 'spam', 'trash'], {
    message: 'comment_approved doit être "0" (en attente), "1" (approuvé), "spam" ou "trash"'
  })
  comment_approved?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  comment_author?: string;

  @IsOptional()
  @IsEmail({}, {
    message: 'Veuillez fournir une adresse email valide'
  })
  @MaxLength(100)
  comment_author_email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  comment_author_url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  comment_agent?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  comment_author_IP?: string;
}