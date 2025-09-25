import { IsNotEmpty, IsString, IsEmail, IsOptional, IsNumber } from 'class-validator';

export class CreateCommentDto {
  @IsNumber()
  @IsNotEmpty()
  comment_post_ID: number;

  @IsString()
  @IsNotEmpty()
  comment_author: string;

  @IsEmail()
  @IsNotEmpty()
  comment_author_email: string;

  @IsOptional()
  @IsString()
  comment_author_url?: string;

  @IsString()
  @IsNotEmpty()
  comment_content: string;

  @IsOptional()
  @IsNumber()
  comment_parent?: number;

  @IsOptional()
  @IsNumber()
  user_id?: number;

  @IsOptional()
  @IsString()
  comment_author_IP?: string;

  @IsOptional()
  @IsString()
  comment_agent?: string;
}