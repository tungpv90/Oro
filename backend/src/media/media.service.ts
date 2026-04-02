import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { Media, MediaType, MediaStatus } from './entities/media.entity';
import { AnimationJob, AnimationStatus } from './entities/animation-job.entity';
import { StorageService } from '../storage/storage.service';
import { VideoProcessingService } from './services/video-processing.service';
import { ProcessAnimationDto, MediaQueryDto } from './dto/media.dto';

@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    @InjectRepository(Media)
    private readonly mediaRepo: Repository<Media>,
    @InjectRepository(AnimationJob)
    private readonly jobRepo: Repository<AnimationJob>,
    private readonly storage: StorageService,
    private readonly videoProcessor: VideoProcessingService,
  ) {}

  async upload(userId: string, file: Express.Multer.File): Promise<Media> {
    const ext = path.extname(file.originalname).toLowerCase();
    const key = `media/${userId}/${uuid()}${ext}`;
    const type = this.getMediaType(file.mimetype);

    await this.storage.upload(key, file.buffer, file.mimetype, file.size);

    const media = this.mediaRepo.create({
      userId,
      type,
      originalUrl: key,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      status: MediaStatus.READY,
    });

    return this.mediaRepo.save(media);
  }

  async findAll(userId: string, query: MediaQueryDto) {
    const { page = 1, limit = 20, type } = query;
    const where: Record<string, unknown> = { userId };
    if (type) where.type = type;

    const [items, total] = await this.mediaRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    // Generate presigned URLs
    const mediaWithUrls = await Promise.all(
      items.map(async (item) => ({
        ...item,
        originalUrl: await this.storage.getPresignedUrl(item.originalUrl),
        thumbnailUrl: item.thumbnailUrl
          ? await this.storage.getPresignedUrl(item.thumbnailUrl)
          : null,
      })),
    );

    return { items: mediaWithUrls, total, page, limit };
  }

  async findOne(id: string, userId: string): Promise<Media & { originalUrl: string }> {
    const media = await this.mediaRepo.findOne({
      where: { id, userId },
      relations: ['animationJobs'],
    });
    if (!media) throw new NotFoundException('Media not found');

    return {
      ...media,
      originalUrl: await this.storage.getPresignedUrl(media.originalUrl),
    };
  }

  async remove(id: string, userId: string): Promise<void> {
    const media = await this.mediaRepo.findOne({ where: { id, userId } });
    if (!media) throw new NotFoundException('Media not found');

    await this.storage.delete(media.originalUrl);
    if (media.thumbnailUrl) await this.storage.delete(media.thumbnailUrl);
    await this.mediaRepo.remove(media);
  }

  async processAnimation(
    mediaId: string,
    userId: string,
    dto: ProcessAnimationDto,
  ): Promise<AnimationJob> {
    const media = await this.mediaRepo.findOne({ where: { id: mediaId, userId } });
    if (!media) throw new NotFoundException('Media not found');

    const job = this.jobRepo.create({
      mediaId,
      deviceId: dto.deviceId,
      fps: dto.fps || 10,
      width: dto.width || 320,
      height: dto.height || 240,
      status: AnimationStatus.PROCESSING,
    });
    await this.jobRepo.save(job);

    // Process asynchronously
    this.processAnimationAsync(job, media).catch((err) => {
      this.logger.error(`Animation processing failed: ${err.message}`);
    });

    return job;
  }

  async getAnimationJob(jobId: string): Promise<AnimationJob> {
    const job = await this.jobRepo.findOne({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Animation job not found');
    return job;
  }

  async downloadFrames(jobId: string, userId: string): Promise<Buffer> {
    const job = await this.jobRepo.findOne({
      where: { id: jobId },
      relations: ['media'],
    });
    if (!job) throw new NotFoundException('Animation job not found');
    if (job.media.userId !== userId) throw new ForbiddenException();
    if (job.status !== AnimationStatus.READY) {
      throw new NotFoundException('Animation not ready');
    }

    return this.storage.getFileBuffer(job.outputPath);
  }

  // ─── Admin ───────────────────────────────────────────
  async adminFindAll(query: MediaQueryDto) {
    const { page = 1, limit = 20, type } = query;
    const where: Record<string, unknown> = {};
    if (type) where.type = type;

    const [items, total] = await this.mediaRepo.findAndCount({
      where,
      relations: ['user'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { items, total, page, limit };
  }

  async adminRemove(id: string): Promise<void> {
    const media = await this.mediaRepo.findOne({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');
    await this.storage.delete(media.originalUrl);
    await this.mediaRepo.remove(media);
  }

  // ─── Private ─────────────────────────────────────────
  private async processAnimationAsync(
    job: AnimationJob,
    media: Media,
  ): Promise<void> {
    let tempInput: string | null = null;

    try {
      // Download original file to temp
      const buffer = await this.storage.getFileBuffer(media.originalUrl);
      const ext = path.extname(media.originalFilename || '.mp4');
      tempInput = path.join(process.cwd(), 'temp', `input_${job.id}${ext}`);
      fs.writeFileSync(tempInput, buffer);

      let result;
      if (media.type === MediaType.VIDEO) {
        result = await this.videoProcessor.processVideoToFrames(
          tempInput,
          job.fps,
          job.width,
          job.height,
        );
      } else {
        result = await this.videoProcessor.processImageToFrame(
          tempInput,
          job.width,
          job.height,
        );
      }

      // Upload processed binary to S3
      const outputKey = `animations/${job.id}.bin`;
      const outputBuffer = fs.readFileSync(result.outputPath);
      await this.storage.upload(
        outputKey,
        outputBuffer,
        'application/octet-stream',
        outputBuffer.length,
      );

      // Cleanup local temp files
      this.videoProcessor.cleanup(result.outputPath);

      // Update job
      await this.jobRepo.update(job.id, {
        status: AnimationStatus.READY,
        frameCount: result.frameCount,
        totalSize: result.totalSize,
        outputPath: outputKey,
      });
    } catch (err) {
      this.logger.error(`Processing failed for job ${job.id}: ${err}`);
      await this.jobRepo.update(job.id, {
        status: AnimationStatus.FAILED,
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      if (tempInput) this.videoProcessor.cleanup(tempInput);
    }
  }

  private getMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('video/')) return MediaType.VIDEO;
    return MediaType.IMAGE;
  }
}
