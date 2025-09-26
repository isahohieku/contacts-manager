import { DataSource } from 'typeorm';

import { AddressTypeEnum } from '../../modules/address-types/address-type.enum';
import { AddressType } from '../../modules/address-types/entities/address-type.entity';

export default class CreateAddressType {
  public async run(factory: unknown, dataSource: DataSource): Promise<void> {
    const count = await dataSource
      .createQueryBuilder()
      .select()
      .from(AddressType, 'AddressType')
      .getCount();

    if (count === 0) {
      await dataSource
        .createQueryBuilder()
        .insert()
        .into(AddressType)
        .values([
          { id: AddressTypeEnum.Home, name: 'Home' },
          { id: AddressTypeEnum.Work, name: 'Work' },
          { id: AddressTypeEnum.Mailing, name: 'Mailing' },
          { id: AddressTypeEnum.Billing, name: 'Billing' },
          { id: AddressTypeEnum.Shipping, name: 'Shipping' },
          { id: AddressTypeEnum.Business, name: 'Business' },
          { id: AddressTypeEnum.Postal, name: 'Postal' },
        ])
        .execute();
    }
  }
}
