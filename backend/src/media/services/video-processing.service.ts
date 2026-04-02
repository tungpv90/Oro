import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ffmpeg from 'fluent-ffmpeg';
import * as path from 'path';
import * as fs from 'fs';
import * as sharp from 'sharp';

export interface FrameProcessingResult {
  frameCount: number;
  fps: number;
  width: number;
  height: number;
  totalSize: number;
  outputPath: string;
}

@Injectable()
export class VideoProcessingService {
  private readonly logger = new Logger(VideoProcessingService.name);
  private readonly tempDir: string;

  constructor(private readonly config: ConfigService) {
    this.tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * Process video into RGB565 frame binary for MCU display.
   * Output format:
   *   Header (7 bytes): frameCount(2B LE) + fps(1B) + width(2B LE) + height(2B LE)
   *   Frames: each frame = width * height * 2 bytes (RGB565, little-endian)
   */
  async processVideoToFrames(
    inputPath: string,
    fps = 10,
    width = 320,
    height = 240,
  ): Promise<FrameProcessingResult> {
    const jobId = Date.now().toString(36);
    const framesDir = path.join(this.tempDir, `frames_${jobId}`);
    fs.mkdirSync(framesDir, { recursive: true });

    try {
      // Step 1: Extract frames from video using FFmpeg
      await this.extractFrames(inputPath, framesDir, fps, width, height);

      // Step 2: Get list of extracted frame files
      const frameFiles = fs
        .readdirSync(framesDir)
        .filter((f) => f.endsWith('.png'))
        .sort();

      if (frameFiles.length === 0) {
        throw new Error('No frames extracted from video');
      }

      // Limit to 100 frames (16MB SPI Flash constraint)
      const maxFrames = 100;
      const selectedFrames = frameFiles.slice(0, maxFrames);

      // Step 3: Convert each frame to RGB565 binary
      const outputPath = path.join(this.tempDir, `animation_${jobId}.bin`);
      await this.packFramesToBinary(
        framesDir,
        selectedFrames,
        outputPath,
        fps,
        width,
        height,
      );

      const stat = fs.statSync(outputPath);

      return {
        frameCount: selectedFrames.length,
        fps,
        width,
        height,
        totalSize: stat.size,
        outputPath,
      };
    } finally {
      // Cleanup temp frame files
      fs.rmSync(framesDir, { recursive: true, force: true });
    }
  }

  /**
   * Process a single image to RGB565 binary.
   */
  async processImageToFrame(
    inputPath: string,
    width = 320,
    height = 240,
  ): Promise<FrameProcessingResult> {
    const jobId = Date.now().toString(36);
    const outputPath = path.join(this.tempDir, `image_${jobId}.bin`);

    const rgb565Buffer = await this.imageToRgb565(inputPath, width, height);

    // Write header + single frame
    const header = this.createHeader(1, 1, width, height);
    const output = Buffer.concat([header, rgb565Buffer]);
    fs.writeFileSync(outputPath, output);

    return {
      frameCount: 1,
      fps: 1,
      width,
      height,
      totalSize: output.length,
      outputPath,
    };
  }

  private extractFrames(
    inputPath: string,
    outputDir: string,
    fps: number,
    width: number,
    height: number,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          `-vf`, `fps=${fps},scale=${width}:${height}`,
          `-frames:v`, `100`,
        ])
        .output(path.join(outputDir, 'frame_%04d.png'))
        .on('end', () => resolve())
        .on('error', (err) => {
          this.logger.error(`FFmpeg error: ${err.message}`);
          reject(err);
        })
        .run();
    });
  }

  private async packFramesToBinary(
    framesDir: string,
    frameFiles: string[],
    outputPath: string,
    fps: number,
    width: number,
    height: number,
  ): Promise<void> {
    const header = this.createHeader(frameFiles.length, fps, width, height);
    const writeStream = fs.createWriteStream(outputPath);
    writeStream.write(header);

    for (const file of frameFiles) {
      const framePath = path.join(framesDir, file);
      const rgb565 = await this.imageToRgb565(framePath, width, height);
      writeStream.write(rgb565);
    }

    return new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
      writeStream.end();
    });
  }

  private async imageToRgb565(
    imagePath: string,
    width: number,
    height: number,
  ): Promise<Buffer> {
    // Get raw RGB pixel data using sharp
    const { data } = await sharp(imagePath)
      .resize(width, height, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // Convert RGB888 to RGB565
    const pixelCount = width * height;
    const rgb565 = Buffer.alloc(pixelCount * 2);

    for (let i = 0; i < pixelCount; i++) {
      const r = data[i * 3];
      const g = data[i * 3 + 1];
      const b = data[i * 3 + 2];

      // RGB565: RRRRR GGGGGG BBBBB (16-bit, little-endian)
      const r5 = (r >> 3) & 0x1f;
      const g6 = (g >> 2) & 0x3f;
      const b5 = (b >> 3) & 0x1f;
      const pixel = (r5 << 11) | (g6 << 5) | b5;

      rgb565.writeUInt16LE(pixel, i * 2);
    }

    return rgb565;
  }

  private createHeader(
    frameCount: number,
    fps: number,
    width: number,
    height: number,
  ): Buffer {
    // Header: frameCount(2B LE) + fps(1B) + width(2B LE) + height(2B LE) = 7 bytes
    const header = Buffer.alloc(7);
    header.writeUInt16LE(frameCount, 0);
    header.writeUInt8(fps, 2);
    header.writeUInt16LE(width, 3);
    header.writeUInt16LE(height, 5);
    return header;
  }

  cleanup(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      this.logger.warn(`Failed to cleanup ${filePath}: ${err}`);
    }
  }
}
