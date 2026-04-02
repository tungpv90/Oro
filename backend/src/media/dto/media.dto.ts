import { IsOptional, IsInt, Min, Max, IsEnum, IsString, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UploadMediaDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file: Express.Multer.File;
}

export class UpdateMediaDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false, enum: ['public', 'private'] })
  @IsOptional()
  @IsString()
  visibility?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class ProcessAnimationDto {
  @ApiProperty({ required: false, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  fps?: number;

  @ApiProperty({ required: false, default: 320 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  width?: number;

  @ApiProperty({ required: false, default: 240 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  height?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  deviceId?: string;
}

export class MediaQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({ required: false, enum: ['image', 'video'] })
  @IsOptional()
  type?: string;
}

export class FeedQueryDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({ required: false, enum: ['image', 'video'] })
  @IsOptional()
  type?: string;

  @ApiProperty({ required: false, enum: ['hot', 'recommended', 'free', 'best_selling', 'latest'] })
  @IsOptional()
  feed?: string;
}
