import { DataSource } from 'typeorm';

import { PhoneType } from '../../modules/phone-types/entities/phone-type.entity';
import { PhoneTypeEnum } from '../../modules/phone-types/phone-type.enum';

export default class CreatePhoneType {
  public async run(factory: any, dataSource: DataSource): Promise<void> {
    const count = await dataSource
      .createQueryBuilder()
      .select()
      .from(PhoneType, 'PhoneType')
      .getCount();

    if (count === 0) {
      await dataSource
        .createQueryBuilder()
        .insert()
        .into(PhoneType)
        .values([
          { id: PhoneTypeEnum.Mobile, name: 'Mobile' },
          { id: PhoneTypeEnum.Home, name: 'Home' },
          { id: PhoneTypeEnum.Work, name: 'Work' },
          { id: PhoneTypeEnum.Fax, name: 'Fax' },
          { id: PhoneTypeEnum['Toll-Free'], name: 'Toll-Free' },
          { id: PhoneTypeEnum.VoIP, name: 'VoIP' },
          { id: PhoneTypeEnum.Virtual, name: 'Virtual' },
          { id: PhoneTypeEnum.Emergency, name: 'Emergency' },
        ])
        .execute();
    }
  }
}
