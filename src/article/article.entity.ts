import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('wp_posts')
@Index(['postType', 'postStatus'])
@Index(['postAuthor'])
@Index(['postParent'])
@Index(['postName'])
export class Article {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  ID: number;

  @Column({ 
    type: 'bigint', 
    unsigned: true, 
    default: 0,
    name: 'post_author'
  })
  postAuthor: number;


@Column({ 
  type: 'datetime',
  name: 'post_date',
  nullable: true
})
postDate: Date | null;

@Column({ 
  type: 'datetime',
  name: 'post_date_gmt',
  nullable: true
})
postDateGmt: Date | null;

@Column({ 
  type: 'datetime',
  name: 'post_modified',
  nullable: true
})
postModified: Date | null;

@Column({ 
  type: 'datetime',
  name: 'post_modified_gmt',
  nullable: true
})
postModifiedGmt: Date | null;


  @Column({ 
    type: 'longtext',
    name: 'post_content'
  })
  postContent: string;

  @Column({ 
    type: 'text',
    name: 'post_title'
  })
  postTitle: string;

  @Column({ 
    type: 'text',
    name: 'post_excerpt'
  })
  postExcerpt: string;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'publish',
    name: 'post_status'
  })
  postStatus: string;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'open',
    name: 'comment_status'
  })
  commentStatus: string;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'open',
    name: 'ping_status'
  })
  pingStatus: string;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    default: '',
    name: 'post_password'
  })
  postPassword: string;

  @Column({ 
    type: 'varchar', 
    length: 200, 
    default: '',
    name: 'post_name'
  })
  postName: string;

  @Column({ 
    type: 'text',
    name: 'to_ping'
  })
  toPing: string;

  @Column({ 
    type: 'text',
    name: 'pinged'
  })
  pinged: string;

  @Column({ 
    type: 'longtext',
    name: 'post_content_filtered'
  })
  postContentFiltered: string;

  @Column({ 
    type: 'bigint', 
    unsigned: true, 
    default: 0,
    name: 'post_parent'
  })
  postParent: number;

  @Column({ 
    type: 'varchar', 
    length: 255, 
    default: '',
    name: 'guid'
  })
  guid: string;

  @Column({ 
    type: 'int', 
    default: 0,
    name: 'menu_order'
  })
  menuOrder: number;

  @Column({ 
    type: 'varchar', 
    length: 20, 
    default: 'post',
    name: 'post_type'
  })
  postType: string;

  @Column({ 
    type: 'varchar', 
    length: 100, 
    default: '',
    name: 'post_mime_type'
  })
  postMimeType: string;

  @Column({ 
    type: 'bigint', 
    default: 0,
    name: 'comment_count'
  })
  commentCount: number;


}