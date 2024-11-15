import { AddressType } from '@contactApp/modules/address-types/entities/address-type.entity';
import { Contact } from '@contactApp/modules/contacts/entities/contact.entity';
import { Country } from '@contactApp/modules/countries/entities/country.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsNotEmpty } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'No. 1, Wakili street' })
  @IsOptional()
  street?: string | null;

  @ApiProperty({ example: 'Zaria' })
  @IsOptional()
  city?: string | null;

  @ApiProperty({ example: 'Kaduna' })
  @IsOptional()
  state?: string | null;

  @ApiProperty({ example: '810103' })
  @IsOptional()
  postal_code?: string | null;

  @ApiProperty({ type: Country, example: { id: 1 } })
  @IsOptional()
  country?: Country;

  @ApiProperty({ type: AddressType, example: { id: 1 } })
  @IsOptional()
  address_type = { id: 1 };

  @ApiProperty({ example: { id: 1 } })
  @IsNotEmpty({ message: 'Contact id is required' })
  contact: Contact;
}
