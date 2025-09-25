import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param,
  Req,
  Patch
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { Comment } from './comment.entity';
import { Request } from 'express';
import { UpdateCommentDto } from 'src/dtos/update-comment.dto';
import { CreateCommentDto } from 'src/dtos/create-comment.dto';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get()
  async findAll(): Promise<Comment[]> {
    return await this.commentService.findAll();
  }

  @Get('article/:articleId')
  async findByArticle(@Param('articleId') articleId: number): Promise<Comment[]> {
    return await this.commentService.findByArticle(Number(articleId));
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Comment> {
    return await this.commentService.findOne(Number(id));
  }

  @Post()
  async create(
    @Body() createCommentDto: CreateCommentDto,
    @Req() req: Request
  ): Promise<{
    status: string;
    message: string;
    data: Comment;
  }> {
    try {
      // Ajouter automatiquement l'IP et User-Agent
      createCommentDto.comment_author_IP = req.ip || req.socket.remoteAddress || '';
      createCommentDto.comment_agent = req.get('user-agent') || '';

      const comment = await this.commentService.create(createCommentDto);
      
      return {
        status: 'success',
        message: 'Commentaire créé avec succès. Il sera visible après modération.',
        data: comment
      };
    } catch (error) {
      console.error('Erreur dans le controller:', error);
      throw error;
    }
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    return await this.commentService.update(Number(id), updateCommentDto);
  }

  @Patch(':id/approve')
  async approve(@Param('id') id: number): Promise<{
    status: string;
    message: string;
    data: Comment;
  }> {
    const comment = await this.commentService.approve(Number(id));
    return {
      status: 'success',
      message: 'Commentaire approuvé avec succès',
      data: comment
    };
  }

  @Patch(':id/reject')
  async reject(@Param('id') id: number): Promise<{
    status: string;
    message: string;
    data: Comment;
  }> {
    const comment = await this.commentService.reject(Number(id));
    return {
      status: 'success',
      message: 'Commentaire rejeté et marqué comme spam',
      data: comment
    };
  }

  @Delete(':id')
  async remove(@Param('id') id: number): Promise<{ message: string }> {
    await this.commentService.remove(Number(id));
    return { message: `Comment ${id} deleted successfully` };
  }
}