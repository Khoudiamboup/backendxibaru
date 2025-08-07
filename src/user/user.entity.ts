import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Article } from 'src/article/article.entity';

@Entity('wp_users') // correspond au nom exact de la table WordPress
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  ID: number;

  @Column({ type: 'varchar', length: 60, name: 'user_login', default: '' })
  userLogin: string;

  @Column({ type: 'varchar', length: 255, name: 'user_pass', default: '' })
  userPass: string;

  @Column({ type: 'varchar', length: 50, name: 'user_nicename', default: '' })
  userNicename: string;

  @Column({ type: 'varchar', length: 100, name: 'user_email', default: '' })
  userEmail: string;

  @Column({ type: 'varchar', length: 100, name: 'user_url', default: '' })
  userUrl: string;

  @Column({ type: 'datetime', name: 'user_registered', nullable: true })
userRegistered: Date | null;


  @Column({ type: 'varchar', length: 255, name: 'user_activation_key', default: '' })
  userActivationKey: string;

  @Column({ type: 'int', name: 'user_status', default: 0 })
  userStatus: number;

  @Column({ type: 'varchar', length: 250, name: 'display_name', default: '' })
  displayName: string;

 
}
