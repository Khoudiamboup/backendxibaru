import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Category } from 'src/category/category.entity';
import { User } from 'src/user/user.entity'; // Si tu as une entité User

@Entity()
export class Article {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true, type: 'text' })
  excerpt: string;

  @Column({ nullable: true, type: 'text' })
  cleanContent: string;

  @Column()
  image: string; // Featured image

  @Column({ nullable: true })
  status: string; // published, draft, etc.

  @CreateDateColumn()
  date: Date;

  @UpdateDateColumn()
  modified: Date;

  @Column({ nullable: true })
  seoTitle: string;

  @Column({ nullable: true, type: 'text' })
  seoDescription: string;

  @Column({ nullable: true })
  link: string;

  @Column({ nullable: true })
  readingTime: string;

  @Column({ nullable: true })
  wordCount: number;

  @Column({ nullable: true })
  formattedDate: string;

  @Column({ nullable: true })
  relativeDate: string;

  @ManyToOne(() => Category, (category) => category.articles)
  category: Category;

  @ManyToOne(() => User, (user) => user.articles)
  author: User;

}
