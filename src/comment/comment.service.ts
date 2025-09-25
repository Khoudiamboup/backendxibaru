import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentDto } from 'src/dtos/create-comment.dto';
import { UpdateCommentDto } from 'src/dtos/update-comment.dto';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async findAll(): Promise<Comment[]> {
    return await this.commentRepository.find({
      where: { comment_approved: '1' },
      order: { comment_date: 'DESC' }
    });
  }

  async findOne(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({ 
      where: { comment_ID: id } 
    });
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    return comment;
  }

  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    console.log('Données reçues pour création:', createCommentDto);

    // Validation des champs obligatoires
    if (!createCommentDto.comment_post_ID) {
      throw new Error('comment_post_ID est obligatoire');
    }
    if (!createCommentDto.comment_author?.trim()) {
      throw new Error('comment_author est obligatoire');
    }
    if (!createCommentDto.comment_author_email?.trim()) {
      throw new Error('comment_author_email est obligatoire');
    }
    if (!createCommentDto.comment_content?.trim()) {
      throw new Error('comment_content est obligatoire');
    }

    // Préparer les données à sauvegarder
    const commentData = {
      comment_post_ID: Number(createCommentDto.comment_post_ID),
      comment_author: createCommentDto.comment_author.trim(),
      comment_author_email: createCommentDto.comment_author_email.trim(),
      comment_author_url: createCommentDto.comment_author_url?.trim() || '',
      comment_content: createCommentDto.comment_content.trim(),
      comment_parent: Number(createCommentDto.comment_parent || 0),
      comment_approved: '0', // En attente par défaut
      comment_date: new Date(),
      comment_date_gmt: new Date(),
      comment_author_IP: createCommentDto.comment_author_IP || '',
      comment_agent: createCommentDto.comment_agent || '',
      comment_type: 'comment',
      user_id: Number(createCommentDto.user_id || 0),
      comment_karma: 0
    };

    console.log('Données à sauvegarder:', commentData);

    try {
      const savedComment = await this.commentRepository.save(commentData);
      console.log('Commentaire créé avec ID:', savedComment.comment_ID);
      return savedComment;
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw new Error('Erreur lors de la création du commentaire: ' + error.message);
    }
  }

  async update(id: number, updateCommentDto: UpdateCommentDto): Promise<Comment> {
    const comment = await this.findOne(id);
    
    // Mettre à jour uniquement les champs fournis
    if (updateCommentDto.comment_content !== undefined) {
      comment.comment_content = updateCommentDto.comment_content;
    }
    if (updateCommentDto.comment_approved !== undefined) {
      comment.comment_approved = updateCommentDto.comment_approved;
    }
    if (updateCommentDto.comment_author !== undefined) {
      comment.comment_author = updateCommentDto.comment_author;
    }
    if (updateCommentDto.comment_author_email !== undefined) {
      comment.comment_author_email = updateCommentDto.comment_author_email;
    }
    if (updateCommentDto.comment_author_url !== undefined) {
      comment.comment_author_url = updateCommentDto.comment_author_url;
    }
    
    return await this.commentRepository.save(comment);
  }

  async remove(id: number): Promise<void> {
    const comment = await this.findOne(id);
    await this.commentRepository.remove(comment);
  }

  // Méthodes supplémentaires
  async findByArticle(articleId: number): Promise<Comment[]> {
    return await this.commentRepository.find({
      where: { 
        comment_post_ID: articleId,
        comment_approved: '1'
      },
      order: { comment_date: 'ASC' }
    });
  }

  async approve(id: number): Promise<Comment> {
    const comment = await this.findOne(id);
    comment.comment_approved = '1';
    return await this.commentRepository.save(comment);
  }

  async reject(id: number): Promise<Comment> {
    const comment = await this.findOne(id);
    comment.comment_approved = 'spam';
    return await this.commentRepository.save(comment);
  }
}