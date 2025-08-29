// import { TypeOrmModule } from '@nestjs/typeorm';
// import { MediaService } from './media.service';
// import { MediaController } from './media.controller';
// import { Module } from '@nestjs/common';
// import { MediaMeta } from './media.entity';

// @Module({
//   imports: [TypeOrmModule.forFeature([MediaMeta])],
//   providers: [MediaService],
//   controllers: [MediaController],
// })
// export class MediaModule {}
// media.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';
import { MediaMeta } from './media.entity';
import cloudinary from 'src/cloudinary/cloudinary.provider'; // <-- import par défaut

@Module({
  imports: [TypeOrmModule.forFeature([MediaMeta])],
  controllers: [MediaController],
  providers: [MediaService], // plus besoin de CloudinaryProvider ici
  exports: [MediaService],
})
export class MediaModule {}
