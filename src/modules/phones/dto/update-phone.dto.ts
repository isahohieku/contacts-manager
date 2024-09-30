import { OmitType, PartialType } from '@nestjs/swagger';

import { CreatePhoneDto } from './create-phone.dto';

export class UpdatePhoneDto extends PartialType(
  OmitType(CreatePhoneDto, ['contact']),
) {}
