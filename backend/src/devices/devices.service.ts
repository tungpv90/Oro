import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from './entities/device.entity';
import { CreateDeviceDto, UpdateDeviceDto } from './dto/device.dto';

@Injectable()
export class DevicesService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
  ) {}

  async create(userId: string, dto: CreateDeviceDto): Promise<Device> {
    const existing = await this.deviceRepo.findOne({
      where: { macAddress: dto.macAddress },
    });
    if (existing) throw new ConflictException('Device with this MAC address already registered');

    const device = this.deviceRepo.create({ ...dto, userId });
    return this.deviceRepo.save(device);
  }

  async findAllByUser(userId: string): Promise<Device[]> {
    return this.deviceRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Device> {
    const device = await this.deviceRepo.findOne({ where: { id, userId } });
    if (!device) throw new NotFoundException('Device not found');
    return device;
  }

  async update(id: string, userId: string, dto: UpdateDeviceDto): Promise<Device> {
    const device = await this.findOne(id, userId);
    Object.assign(device, dto);
    return this.deviceRepo.save(device);
  }

  async updateLastConnected(id: string, userId: string): Promise<Device> {
    const device = await this.findOne(id, userId);
    device.lastConnected = new Date();
    return this.deviceRepo.save(device);
  }

  async remove(id: string, userId: string): Promise<void> {
    const device = await this.findOne(id, userId);
    await this.deviceRepo.remove(device);
  }
}
