import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ValidationArguments } from 'class-validator/types/validation/ValidationArguments';
import { AppDataSource } from 'src/database/data-source';

@ValidatorConstraint({ name: 'IsExist', async: true })
export class IsExist implements ValidatorConstraintInterface {
  async validate(value: string, validationArguments: ValidationArguments) {
    const repository = validationArguments.constraints[0];
    const pathToProperty = validationArguments.constraints[1];
    const entity: unknown = await AppDataSource.getRepository(
      repository,
    ).findOne({
      where: {
        [pathToProperty ? pathToProperty : validationArguments.property]:
          pathToProperty ? value?.[pathToProperty] : value,
      },
    });

    return Boolean(entity);
  }
}
