

import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('wp_terms')
export class Category {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  term_id: number;

  @Column({ type: 'varchar', length: 200 })
  name: string;

  @Column({ type: 'varchar', length: 200 })
  slug: string;

  @Column({ type: 'bigint', default: 0 })
  term_group: number;
}
