import { IsString, IsOptional, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDeviceDto {
  @ApiProperty({ example: 'My Oro Device' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'AA:BB:CC:DD:EE:FF' })
  @IsString()
  @Matches(/^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/, {
    message: 'macAddress must be a valid MAC address (AA:BB:CC:DD:EE:FF)',
  })
  macAddress: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  firmwareVersion?: string;
}

export class UpdateDeviceDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  firmwareVersion?: string;
}
