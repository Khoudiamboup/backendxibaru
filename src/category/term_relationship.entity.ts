import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('wp_term_relationships')
export class TermRelationship {
  @PrimaryColumn({ type: 'bigint', unsigned: true })
  object_id: number;

  @PrimaryColumn({ type: 'bigint', unsigned: true })
  term_taxonomy_id: number;

  @Column({ type: 'int', default: 0 })
  term_order: number;
}
