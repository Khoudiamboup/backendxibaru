import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('wp_comments')
export class Comment {
   @PrimaryColumn({ 
    name: 'comment_ID', 
    type: 'bigint',
    generated: 'increment' 
  })
  comment_ID: number;

  @Column({ name: 'comment_post_ID', type: 'bigint' })
  comment_post_ID: number;

  @Column({ name: 'comment_author', type: 'tinytext' })
  comment_author: string;

  @Column({ name: 'comment_author_email', type: 'varchar', length: 100 })
  comment_author_email: string;

  @Column({ name: 'comment_author_url', type: 'varchar', length: 200 })
  comment_author_url: string;

  @Column({ name: 'comment_author_IP', type: 'varchar', length: 100 })
  comment_author_IP: string;

  @Column({ name: 'comment_date', type: 'datetime' })
  comment_date: Date;

  @Column({ name: 'comment_date_gmt', type: 'datetime' })
  comment_date_gmt: Date;

  @Column({ name: 'comment_content', type: 'text' })
  comment_content: string;

  @Column({ name: 'comment_karma', type: 'int' })
  comment_karma: number;

  @Column({ name: 'comment_approved', type: 'varchar', length: 20 })
  comment_approved: string;

  @Column({ name: 'comment_agent', type: 'varchar', length: 255 })
  comment_agent: string;

  @Column({ name: 'comment_type', type: 'varchar', length: 20 })
  comment_type: string;

  @Column({ name: 'comment_parent', type: 'bigint' })
  comment_parent: number;

  @Column({ name: 'user_id', type: 'bigint' })
  user_id: number;
}
