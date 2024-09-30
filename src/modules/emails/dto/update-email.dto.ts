import { PartialType, OmitType } from '@nestjs/swagger';

import { CreateEmailDto } from './create-email.dto';

export class UpdateEmailDto extends PartialType(
  OmitType(CreateEmailDto, ['contact']),
) {}
