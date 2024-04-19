import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class AuthUpdateDto {
  @ApiProperty({ example: 'John' })
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Doe' })
  @IsOptional()
  lastName?: string;

  @ApiProperty()
  @IsOptional()
  password?: string;

  @ApiProperty()
  @IsOptional()
  oldPassword?: string;
}
