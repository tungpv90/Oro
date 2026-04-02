import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Media } from './entities/media.entity';
import { AnimationJob } from './entities/animation-job.entity';
import { MediaService } from './media.service';
import { MediaController, AdminMediaController, FeedController } from './media.controller';
import { VideoProcessingService } from './services/video-processing.service';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Media, AnimationJob])],
  controllers: [MediaController, AdminMediaController, FeedController],
  providers: [MediaService, VideoProcessingService, RolesGuard],
  exports: [MediaService],
})
export class MediaModule {}
