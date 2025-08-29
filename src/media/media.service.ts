// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { MediaMeta } from './media.entity';

// @Injectable()
// export class MediaService {
//   constructor(
//     @InjectRepository(MediaMeta)
//     private readonly mediaMetaRepo: Repository<MediaMeta>,
//   ) {}

//   async getImageUrlByPostId(postId: number): Promise<string | null> {
//     const meta = await this.mediaMetaRepo.findOne({
//       where: {
//         post_id: postId,
//         meta_key: '_wp_attached_file',
//       },
//     });

//     if (!meta) return null;

//     const uploadsPath = meta.meta_value; 
//     const baseUrl = 'https://xibarubamback.onrender.com/uploads/';

//     return `${baseUrl}${uploadsPath}`;
//   }

//   async findAll() {
//     return this.mediaMetaRepo.find({
//       where: { meta_key: '_wp_attached_file' },
//     });
//   }
//  async upload(file: Express.Multer.File) {
//     const filePath = `uploads/${file.filename}`;

//     const meta = this.mediaMetaRepo.create({
//       post_id: 0, 
//       meta_key: '_wp_attached_file',
//       meta_value: filePath,
//     });

//     await this.mediaMetaRepo.save(meta);

//     return { message: 'Fichier uploadé', path: filePath };
//   }



//   async findImagesWithPath() {
//     return await this.mediaMetaRepo.find({
//       where: { meta_key: '_wp_attached_file' },
//     });
//   }

//   async delete(id: number) {
//     const result = await this.mediaMetaRepo.delete(id);
//     return result.affected ? { message: 'Supprimé avec succès' } : { message: 'Non trouvé' };
//   }
  
// }


import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MediaMeta } from './media.entity';
import cloudinary from 'src/cloudinary/cloudinary.provider';
import * as streamifier from 'streamifier';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(MediaMeta)
    private readonly mediaMetaRepo: Repository<MediaMeta>,
  ) {}

  // Upload d'un fichier vers Cloudinary
  async upload(file: Express.Multer.File) {
    if (!file) throw new Error('Fichier requis pour l\'upload');

    // Upload sur Cloudinary
    const result: any = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `media/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`,
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        },
      );
      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });

    // Sauvegarde dans la base
    const meta = this.mediaMetaRepo.create({
      post_id: 0, // À lier plus tard si besoin
      meta_key: '_wp_attached_file',
      meta_value: result.secure_url, // URL Cloudinary
    });

    await this.mediaMetaRepo.save(meta);

    return { message: 'Fichier uploadé sur Cloudinary', cloudinaryUrl: result.secure_url };
  }

  async findAll() {
    return this.mediaMetaRepo.find({
      where: { meta_key: '_wp_attached_file' },
    });
  }

  async findImagesWithPath() {
    return this.mediaMetaRepo.find({
      where: { meta_key: '_wp_attached_file' },
    });
  }

  async getImageUrlByPostId(postId: number): Promise<string | null> {
    const meta = await this.mediaMetaRepo.findOne({
      where: {
        post_id: postId,
        meta_key: '_wp_attached_file',
      },
    });

    if (!meta) return null;

    return meta.meta_value; // Contient l'URL Cloudinary
  }

  async delete(metaId: number) {
    const result = await this.mediaMetaRepo.delete({ meta_id: metaId });
    return result.affected
      ? { message: 'Supprimé avec succès' }
      : { message: 'Non trouvé' };
  }

  // Méthode pour créer une image Cloudinary associée à un article
  async createCloudinaryImagePost(cloudinaryUrl: string, postId = 0): Promise<number> {
    const meta = this.mediaMetaRepo.create({
      post_id: postId,
      meta_key: '_wp_attached_file',
      meta_value: cloudinaryUrl,
    });

    const savedMeta = await this.mediaMetaRepo.save(meta);
    return savedMeta.meta_id;
  }
}
