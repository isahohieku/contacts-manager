import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { PhoneType } from '../../phone-types/entities/phone-type.entity';

export class UpdatePhoneDto {
  @ApiProperty({ example: '+2348036133002' })
  @IsOptional()
  phone_number: string | null;

  @ApiProperty({ type: PhoneType })
  @IsOptional()
  phone_type?: PhoneType;
}
