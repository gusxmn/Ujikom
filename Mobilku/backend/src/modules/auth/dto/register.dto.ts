import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '081234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W]).{6,50})/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  password: string;

  @ApiProperty({ example: 'Jl. Contoh No. 123' })
  @IsString()
  @IsOptional()
  address?: string;
}
