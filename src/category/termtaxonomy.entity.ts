import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from './category.entity';

@Entity('wp_term_taxonomy')
export class TermTaxonomy {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  term_taxonomy_id: number;

  @Column({ type: 'bigint', unsigned: true })
  term_id: number;

  @ManyToOne(() => Category)
  @JoinColumn({ name: 'term_id' })
  term: Category;

  @Column({ type: 'varchar', length: 32 })
  taxonomy: string;

  @Column({ type: 'longtext' })
  description: string;

  @Column({ type: 'bigint', unsigned: true, default: 0 })
  parent: number;

  @Column({ type: 'bigint', default: 0 })
  count: number;
}
