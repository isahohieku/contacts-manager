import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ValidationArguments } from 'class-validator/types/validation/ValidationArguments';
import { repositories } from './all-entities';

@ValidatorConstraint({ name: 'IsExist', async: true })
export class IsExist implements ValidatorConstraintInterface {
  async validate(value: string, validationArguments: ValidationArguments) {
    const repository =
      repositories[validationArguments.constraints[0] as string];
    const pathToProperty = validationArguments.constraints[1];
    const entity: unknown = await repository.findOne({
      where: {
        [pathToProperty ? pathToProperty : validationArguments.property]:
          pathToProperty ? value?.[pathToProperty] : value,
      },
    });

    return Boolean(entity);
  }
}
