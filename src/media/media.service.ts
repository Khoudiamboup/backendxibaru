
// import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { MediaMeta } from './media.entity';
// import cloudinary from 'src/cloudinary/cloudinary.provider';
// import * as streamifier from 'streamifier';

// @Injectable()
// export class MediaService {
//   constructor(
//     @InjectRepository(MediaMeta)
//     private readonly mediaMetaRepo: Repository<MediaMeta>,
//   ) {}

//   // Upload d'un fichier vers Cloudinary
//   async upload(file: Express.Multer.File) {
//     if (!file) throw new Error('Fichier requis pour l\'upload');

//     // Upload sur Cloudinary
//     const result: any = await new Promise((resolve, reject) => {
//       const uploadStream = cloudinary.uploader.upload_stream(
//         {
//           folder: `media/${new Date().getFullYear()}/${String(new Date().getMonth() + 1).padStart(2, '0')}`,
//           resource_type: 'auto',
//         },
//         (error, result) => {
//           if (error) return reject(error);
//           resolve(result);
//         },
//       );
//       streamifier.createReadStream(file.buffer).pipe(uploadStream);
//     });

//     // Sauvegarde dans la base
//     const meta = this.mediaMetaRepo.create({
//       post_id: 0, // À lier plus tard si besoin
//       meta_key: '_wp_attached_file',
//       meta_value: result.secure_url, // URL Cloudinary
//     });

//     await this.mediaMetaRepo.save(meta);

//     return { message: 'Fichier uploadé sur Cloudinary', cloudinaryUrl: result.secure_url };
//   }

//   async findAll() {
//     return this.mediaMetaRepo.find({
//       where: { meta_key: '_wp_attached_file' },
//     });
//   }

//   async findImagesWithPath() {
//     return this.mediaMetaRepo.find({
//       where: { meta_key: '_wp_attached_file' },
//     });
//   }

//   async getImageUrlByPostId(postId: number): Promise<string | null> {
//     const meta = await this.mediaMetaRepo.findOne({
//       where: {
//         post_id: postId,
//         meta_key: '_wp_attached_file',
//       },
//     });

//     if (!meta) return null;

//     return meta.meta_value; // Contient l'URL Cloudinary
//   }

//   async delete(metaId: number) {
//     const result = await this.mediaMetaRepo.delete({ meta_id: metaId });
//     return result.affected
//       ? { message: 'Supprimé avec succès' }
//       : { message: 'Non trouvé' };
//   }

//   // Méthode pour créer une image Cloudinary associée à un article
//   async createCloudinaryImagePost(cloudinaryUrl: string, postId = 0): Promise<number> {
//     const meta = this.mediaMetaRepo.create({
//       post_id: postId,
//       meta_key: '_wp_attached_file',
//       meta_value: cloudinaryUrl,
//     });

//     const savedMeta = await this.mediaMetaRepo.save(meta);
//     return savedMeta.meta_id;
//   }
// }

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
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

  // ========== GESTION DES VUES ==========

  // Récupérer le nombre de vues d'un article
  async getPostViews(postId: number): Promise<number> {
    const viewsMeta = await this.mediaMetaRepo.findOne({
      where: {
        post_id: postId,
        meta_key: 'post_views'
      }
    });

    return viewsMeta ? parseInt(viewsMeta.meta_value || '0') : 0;
  }

  // Incrémenter les vues d'un article
  async incrementPostViews(postId: number): Promise<number> {
    const currentViews = await this.getPostViews(postId);
    const newViews = currentViews + 1;

    // Vérifier si l'entrée post_views existe déjà
    const existingViewsMeta = await this.mediaMetaRepo.findOne({
      where: {
        post_id: postId,
        meta_key: 'post_views'
      }
    });

    if (existingViewsMeta) {
      // Mettre à jour l'entrée existante
      await this.mediaMetaRepo.update(
        { meta_id: existingViewsMeta.meta_id },
        { meta_value: newViews.toString() }
      );
    } else {
      // Créer nouvelle entrée pour les vues
      await this.mediaMetaRepo.save({
        post_id: postId,
        meta_key: 'post_views',
        meta_value: newViews.toString()
      });
    }

    return newViews;
  }

  // Récupérer les vues pour plusieurs articles (utile pour le dashboard)

async getViewsForMultiplePosts(postIds: number[]): Promise<Record<number, number>> {
  if (!postIds || postIds.length === 0) {
    return {};
  }

  const viewsData = await this.mediaMetaRepo.find({
    where: {
      post_id: In(postIds),
      meta_key: 'post_views'
    }
  });

  const viewsMap: Record<number, number> = {};
  
  // Mapper les vues existantes
  viewsData.forEach(meta => {
    viewsMap[meta.post_id] = parseInt(meta.meta_value || '0');
  });

  // Ajouter 0 pour les posts sans vues enregistrées
  postIds.forEach(id => {
    if (!(id in viewsMap)) {
      viewsMap[id] = 0;
    }
  });

  return viewsMap;
}

  

  // Obtenir les articles les plus vus
  async getMostViewedPosts(limit = 10): Promise<Array<{postId: number, views: number}>> {
    const viewsData = await this.mediaMetaRepo.find({
      where: { meta_key: 'post_views' },
      order: { meta_value: 'DESC' },
      take: limit
    });

    return viewsData.map(meta => ({
      postId: meta.post_id,
      views: parseInt(meta.meta_value || '0')
    }));
  }

  // Réinitialiser les vues d'un article (utile pour les tests)
  async resetPostViews(postId: number): Promise<void> {
    const existingViewsMeta = await this.mediaMetaRepo.findOne({
      where: {
        post_id: postId,
        meta_key: 'post_views'
      }
    });

    if (existingViewsMeta) {
      await this.mediaMetaRepo.update(
        { meta_id: existingViewsMeta.meta_id },
        { meta_value: '0' }
      );
    }
  }
}