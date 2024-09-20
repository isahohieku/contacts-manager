import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ example: 'Friends' })
  @IsNotEmpty()
  name: string;
}
