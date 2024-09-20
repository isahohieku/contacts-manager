import { PartialType } from '@nestjs/mapped-types';
import { CreateContactDto } from './create-contact.dto';
import { Tag } from '../../tags/entities/tag.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class UpdateContactDto extends PartialType(CreateContactDto) {
  @ApiProperty({ example: '[1, 2, 3]' })
  @IsOptional()
  tags?: Tag[];
}
