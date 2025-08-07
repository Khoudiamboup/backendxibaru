import { TypeOrmModule } from '@nestjs/typeorm';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { Module } from '@nestjs/common';
import { MediaMeta } from './media.entity';

@Module({
  imports: [TypeOrmModule.forFeature([MediaMeta])],
  providers: [MediaService],
  controllers: [MediaController],
})
export class MediaModule {}
