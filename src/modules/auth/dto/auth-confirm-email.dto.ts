import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class AuthConfirmEmailDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'Invalid confirmation code sent' })
  hash: string;
}
