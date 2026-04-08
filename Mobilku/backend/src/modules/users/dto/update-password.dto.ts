import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({ example: 'NewPassword123' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  newPassword: string;
}