import { Tag } from '@contactApp/modules/tags/entities/tag.entity';
import { PartialType } from '@nestjs/mapped-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

import { CreateContactDto } from './create-contact.dto';

export class UpdateContactDto extends PartialType(CreateContactDto) {
  @ApiProperty({ example: '[1, 2, 3]' })
  @IsOptional()
  tags?: Tag[];
}
