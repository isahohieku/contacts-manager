import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { CreatePhoneDto } from 'src/phones/dto/create-phone.dto';
import { Phone } from 'src/phones/entities/phone.entity';

@ApiExtraModels(CreatePhoneDto)
export class CreateContactDto {
  @ApiProperty({ example: 'John' })
  @IsNotEmpty({ message: 'firstnameRequired' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsOptional()
  lastName?: string | null;

  @ApiProperty({ example: 'General Hospital' })
  @IsOptional()
  organization?: string | null;

  @ApiProperty({ example: 'Medical Doctor' })
  @IsOptional()
  job_title?: string | null;

  @ApiProperty({ example: '2006-01-01' })
  @IsOptional()
  birthday?: Date;

  @ApiProperty({ example: '2006-01-01' })
  @IsOptional()
  anniversary?: Date;

  @ApiProperty({ example: 'https://s3.....' })
  @IsOptional()
  avatar?: string | null;

  @ApiProperty({ example: 'Wonderful note' })
  @IsOptional()
  notes?: string | null;

  @ApiProperty({
    type: 'array',
    items: { oneOf: [{ $ref: getSchemaPath(CreatePhoneDto) }] },
  })
  @IsOptional()
  phone_numbers?: Phone[] | null;
}
