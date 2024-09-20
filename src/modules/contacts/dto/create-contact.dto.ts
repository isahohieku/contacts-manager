import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { CreatePhoneDto } from '../../phones/dto/create-phone.dto';
import { FileEntity } from '../../files/entities/file.entity';

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

  @ApiProperty({ type: FileEntity, example: { id: 1 } })
  @IsOptional()
  avatar?: FileEntity | null;

  @ApiProperty({ example: 'Wonderful note' })
  @IsOptional()
  notes?: string | null;
}
