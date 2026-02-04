import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { RegisterDto } from './register.dto';

export class RegisterAdminDto extends RegisterDto {
  @ApiProperty({ example: 'ADMIN_SECRET_123' })
  @IsString()
  adminSecret: string;
}