import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
  ) {}

  async getCommentsByPost(postId: number, page = 1, perPage = 10) {
    const [comments, total] = await this.commentRepository.findAndCount({
      where: {
        comment_post_ID: postId,
        comment_approved: '1',
      },
      order: { comment_date: 'DESC' },
      skip: (page - 1) * perPage,
      take: perPage,
    });

    return {
      comments,
      total,
      totalPages: Math.ceil(total / perPage),
      currentPage: page,
    };
  }
}
