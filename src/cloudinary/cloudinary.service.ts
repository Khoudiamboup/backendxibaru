import { Injectable, BadRequestException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: 'daepsasbx',
      api_key: '235228688974287',
      api_secret: 'hlSXR_xPnlax4CHrZNxF56vdG-I',
    });
    
    console.log('Configuration Cloudinary:', {
      cloud_name: 'daepsasbx',
      api_key: '235228688974287',
      api_secret: 'hlSXR_xPnlax4CHrZNxF56vdG-I'
    });
  }

  async uploadImage(file: Express.Multer.File) {
    console.log('=== DÉBUT UPLOAD CLOUDINARY ===');
    console.log('Taille du fichier:', file.size);
    console.log('Type MIME:', file.mimetype);
    console.log('Nom original:', file.originalname);

    if (!file || !file.buffer) {
      throw new BadRequestException('Fichier invalide');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { 
          folder: 'uploads',
          resource_type: 'image',
          public_id: `${Date.now()}_${file.originalname}`,
        },
        (error, result) => {
          console.log('=== RÉPONSE CLOUDINARY ===');
          if (error) {
            console.error('Erreur Cloudinary:', error);
            reject({
              message: 'Erreur lors de l\'upload sur Cloudinary',
              error: error.message,
              statusCode: 400
            });
          } else {
            console.log('Succès Cloudinary:', {
              url: result?.secure_url,
              public_id: result?.public_id
            });
            resolve({
              url: result?.secure_url,
              public_id: result?.public_id,
              message: 'Image uploadée avec succès'
            });
          }
        }
      );

      uploadStream.end(file.buffer);
    });
  }
}