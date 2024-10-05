import { repositories } from '@contactApp/shared/entities/all-entities';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

type ValidationEntity =
  | {
      id?: number | string;
    }
  | undefined;

@ValidatorConstraint({ name: 'IsNotExist', async: true })
export class IsNotExist implements ValidatorConstraintInterface {
  async validate(value: string, validationArguments: ValidationArguments) {
    const repository =
      repositories[validationArguments.constraints[0] as string];
    const currentValue = validationArguments.object as ValidationEntity;

    const entity = (await repository.findOne({
      where: { [validationArguments.property]: value },
    })) as ValidationEntity;

    if (
      entity?.[validationArguments.property] ===
      currentValue?.[validationArguments.property]
    ) {
      return false;
    }

    return true;
  }
}
