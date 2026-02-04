import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePasswordDto {
  @ApiProperty({ example: 'NewPassword123!' })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  @Matches(/((?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[\W]).{6,50})/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
  })
  newPassword: string;
}