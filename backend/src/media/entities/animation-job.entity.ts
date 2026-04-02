import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Media } from './media.entity';
import { Device } from '../../devices/entities/device.entity';

export enum AnimationStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  FAILED = 'failed',
}

@Entity('animation_jobs')
export class AnimationJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  mediaId: string;

  @ManyToOne(() => Media, (media) => media.animationJobs, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mediaId' })
  media: Media;

  @Column({ nullable: true })
  deviceId: string;

  @ManyToOne(() => Device, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'deviceId' })
  device: Device;

  @Column({ default: 0 })
  frameCount: number;

  @Column({ default: 10 })
  fps: number;

  @Column({ default: 320 })
  width: number;

  @Column({ default: 240 })
  height: number;

  @Column({ default: 'rgb565' })
  format: string;

  @Column({ default: 0 })
  totalSize: number;

  @Column({ type: 'enum', enum: AnimationStatus, default: AnimationStatus.PENDING })
  status: AnimationStatus;

  @Column({ nullable: true })
  outputPath: string;

  @Column({ nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
