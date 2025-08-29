// import {
//   Controller,
//   Post,
//   Get,
//   Delete,
//   Param,
//   UseGuards,
//   UploadedFile,
//   UseInterceptors,
// } from '@nestjs/common';
// import { FileInterceptor } from '@nestjs/platform-express';
// import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
// import { MediaService } from './media.service';

// @Controller('media')
// @UseGuards(JwtAuthGuard)
// export class MediaController {
//   constructor(private readonly mediaService: MediaService) {}

//   @UseGuards(JwtAuthGuard)
//   @Post('upload')
//   @UseInterceptors(FileInterceptor('file'))
//   uploadMedia(@UploadedFile() file: Express.Multer.File) {
//     return this.mediaService.upload(file);
//   }

//   @UseGuards(JwtAuthGuard)
//   @Get()
//   getAllMedia() {
//     return this.mediaService.findAll();
//   }

//   @UseGuards(JwtAuthGuard)
//   @Get('images')
//   getImagesWithPath() {
//     return this.mediaService.findImagesWithPath();
//   }
  
//   @UseGuards(JwtAuthGuard)
//   @Delete(':id')
//   deleteMedia(@Param('id') id: string) {
//     return this.mediaService.delete(+id);
//   }
// }
import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from 'src/auth/strategies/jwt-auth.guard';
import { MediaService } from './media.service';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadMedia(@UploadedFile() file: Express.Multer.File) {
    try {
      const result = await this.mediaService.upload(file);
      return {
        success: true,
        message: result.message,
        cloudinaryUrl: result.cloudinaryUrl,
      };
    } catch (error) {
      return {
        success: false,
        message: 'Erreur lors de l\'upload',
        error: error.message,
      };
    }
  }

  @Get()
  async getAllMedia() {
    const media = await this.mediaService.findAll();
    return {
      success: true,
      data: media,
    };
  }

  @Get('images')
  async getImagesWithPath() {
    const images = await this.mediaService.findImagesWithPath();
    return {
      success: true,
      data: images,
    };
  }

  @Delete(':id')
  async deleteMedia(@Param('id') id: string) {
    const result = await this.mediaService.delete(Number(id));
    return {
      success: result.message === 'Supprimé avec succès',
      message: result.message,
    };
  }
}
