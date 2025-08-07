import { Controller, Get, Param, Query } from '@nestjs/common';
import { CommentService } from './comment.service';

@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Get(':postId')
  async getComments(
    @Param('postId') postId: number,
    @Query('page') page = 1,
    @Query('perPage') perPage = 10,
  ) {
    return this.commentService.getCommentsByPost(+postId, +page, +perPage);
  }
}
