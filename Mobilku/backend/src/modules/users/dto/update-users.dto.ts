import { IsString, IsEmail, IsOptional, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-users.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}