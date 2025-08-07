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
// @UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadMedia(@UploadedFile() file: Express.Multer.File) {
    return this.mediaService.upload(file);
  }

  @Get()
  getAllMedia() {
    return this.mediaService.findAll();
  }

  @Get('images')
  getImagesWithPath() {
    return this.mediaService.findImagesWithPath();
  }

  @Delete(':id')
  deleteMedia(@Param('id') id: string) {
    return this.mediaService.delete(+id);
  }
}
