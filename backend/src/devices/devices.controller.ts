import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DevicesService } from './devices.service';
import { CreateDeviceDto, UpdateDeviceDto } from './dto/device.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Devices')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @ApiOperation({ summary: 'Register a new device' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDeviceDto,
  ) {
    return this.devicesService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List user devices' })
  async findAll(@CurrentUser('id') userId: string) {
    return this.devicesService.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get device detail' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.devicesService.findOne(id, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update device' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateDeviceDto,
  ) {
    return this.devicesService.update(id, userId, dto);
  }

  @Put(':id/connected')
  @ApiOperation({ summary: 'Update device last connected time' })
  async updateConnected(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.devicesService.updateLastConnected(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove device' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    await this.devicesService.remove(id, userId);
    return { message: 'Device removed' };
  }
}
