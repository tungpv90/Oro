import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  avatar?: string;
}

export class AdminUpdateUserDto extends UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ required: false, enum: ['user', 'admin'] })
  @IsString()
  @IsOptional()
  role?: string;
}
