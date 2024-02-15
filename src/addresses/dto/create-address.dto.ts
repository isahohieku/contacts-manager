import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { AddressType } from 'src/address-types/entities/address-type.entity';
import { Contact } from 'src/contacts/entities/contact.entity';

export class CreateAddressDto {
  @ApiProperty({ example: 'No. 1, Wakili street' })
  @IsOptional()
  street: string | null;

  @ApiProperty({ example: 'Zaria' })
  @IsOptional()
  city: string | null;

  @ApiProperty({ example: 'Kaduna' })
  @IsOptional()
  state: string | null;

  @ApiProperty({ example: '810103' })
  @IsOptional()
  postal_code: string | null;

  @ApiProperty({ example: 'Nigeria' })
  @IsOptional()
  country: string | null;

  @ApiProperty({ type: AddressType })
  @IsOptional()
  address_type?: AddressType | null;

  @ApiProperty({ example: 1 })
  @IsOptional()
  contact: Contact;
}
