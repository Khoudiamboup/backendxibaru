import { Injectable } from '@nestjs/common';
import cloudinary from './cloudinary.provider';

@Injectable()
export class CloudinaryService {
  async uploadImage(file: Express.Multer.File) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder: 'uploads' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      ).end(file.buffer);
    });
  }
}
