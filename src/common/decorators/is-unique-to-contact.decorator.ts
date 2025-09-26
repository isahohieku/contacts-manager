import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import set from 'lodash/set';

import { CreateEmailDto } from '@contactApp/modules/emails/dto/create-email.dto';

@ValidatorConstraint({ name: 'IsUniqueToContact', async: true })
export class IsUniqueToContact implements ValidatorConstraintInterface {
  async validate(
    value: unknown,
    validationArguments: ValidationArguments,
  ): Promise<boolean> {
    const repository = validationArguments.constraints[0];
    const property = validationArguments.property;

    const query = set({}, property, value);
    set(
      query,
      'contact',
      (validationArguments.object as CreateEmailDto).contact,
    );

    const found = await repository.findOne({
      where: query,
    });

    if (found) {
      return false;
    }

    return true;
  }
}
