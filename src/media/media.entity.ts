import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('wp_postmeta')
export class MediaMeta {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  meta_id: number;

  @Column({ type: 'bigint', unsigned: true })
  post_id: number;

  @Column({ type: 'varchar', length: 255 })
  meta_key: string;

  @Column({ type: 'longtext', nullable: true })
  meta_value: string;
}
