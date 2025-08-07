// media.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaMeta } from './media.entity';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(MediaMeta)
    private readonly mediaMetaRepo: Repository<MediaMeta>,
  ) {}

  async getImageUrlByPostId(postId: number): Promise<string | null> {
    const meta = await this.mediaMetaRepo.findOne({
      where: {
        post_id: postId,
        meta_key: '_wp_attached_file',
      },
    });

    if (!meta) return null;

    const uploadsPath = meta.meta_value; 
    const baseUrl = 'http://localhost:3001/uploads/';

    return `${baseUrl}${uploadsPath}`;
  }

  async findAll() {
    return this.mediaMetaRepo.find({
      where: { meta_key: '_wp_attached_file' },
    });
  }
 async upload(file: Express.Multer.File) {
    const filePath = `uploads/${file.filename}`;

    // Sauvegarde dans la base (exemple)
    const meta = this.mediaMetaRepo.create({
      post_id: 0, // à adapter
      meta_key: '_wp_attached_file',
      meta_value: filePath,
    });

    await this.mediaMetaRepo.save(meta);

    return { message: 'Fichier uploadé', path: filePath };
  }



  async findImagesWithPath() {
    return await this.mediaMetaRepo.find({
      where: { meta_key: '_wp_attached_file' },
    });
  }

  // 🔸 Supprimer une entrée
  async delete(id: number) {
    const result = await this.mediaMetaRepo.delete(id);
    return result.affected ? { message: 'Supprimé avec succès' } : { message: 'Non trouvé' };
  }
  
}
