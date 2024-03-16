import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { PhoneType } from '../../phone-types/entities/phone-type.entity';
import { PhoneTypeEnum } from '../../phone-types/phone-type.enum';

export default class CreatePhoneType implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<void> {
    const count = await connection
      .createQueryBuilder()
      .select()
      .from(PhoneType, 'PhoneType')
      .getCount();

    if (count === 0) {
      await connection
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
