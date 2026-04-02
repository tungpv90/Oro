import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { Response } from 'express';
import { MediaService } from './media.service';
import { ProcessAnimationDto, MediaQueryDto } from './dto/media.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

@ApiTags('Media')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload image or video' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req, file, cb) => {
        const allowed = /^(image|video)\//;
        if (!allowed.test(file.mimetype)) {
          return cb(new Error('Only image and video files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async upload(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.mediaService.upload(userId, file);
  }

  @Get()
  @ApiOperation({ summary: 'List user media' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() query: MediaQueryDto,
  ) {
    return this.mediaService.findAll(userId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get media detail' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.mediaService.findOne(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete media' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.mediaService.remove(id, userId);
    return { message: 'Media deleted' };
  }

  @Post(':id/process-animation')
  @ApiOperation({ summary: 'Process media into animation frames for device' })
  async processAnimation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ProcessAnimationDto,
  ) {
    return this.mediaService.processAnimation(id, userId, dto);
  }

  @Get('animation-jobs/:jobId')
  @ApiOperation({ summary: 'Get animation job status' })
  async getJobStatus(@Param('jobId', ParseUUIDPipe) jobId: string) {
    return this.mediaService.getAnimationJob(jobId);
  }

  @Get('animation-jobs/:jobId/download')
  @ApiOperation({ summary: 'Download processed animation binary' })
  async downloadFrames(
    @Param('jobId', ParseUUIDPipe) jobId: string,
    @CurrentUser('id') userId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const buffer = await this.mediaService.downloadFrames(jobId, userId);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="animation_${jobId}.bin"`,
    });
    return new StreamableFile(buffer);
  }
}

@ApiTags('Admin Media')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin/media')
export class AdminMediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  @ApiOperation({ summary: 'List all media (admin)' })
  async findAll(@Query() query: MediaQueryDto) {
    return this.mediaService.adminFindAll(query);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete any media (admin)' })
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.mediaService.adminRemove(id);
    return { message: 'Media deleted' };
  }
}
