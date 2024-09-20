import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { AddressType } from '../../modules/address-types/entities/address-type.entity';
import { AddressTypeEnum } from '../../modules/address-types/address-type.enum';

export default class CreateAddressType implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<void> {
    const count = await connection
      .createQueryBuilder()
      .select()
      .from(AddressType, 'AddressType')
      .getCount();

    if (count === 0) {
      await connection
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
