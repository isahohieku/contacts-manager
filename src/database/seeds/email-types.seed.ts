import { Connection } from 'typeorm';
import { Factory, Seeder } from 'typeorm-seeding';

import { EmailTypeEnum } from '../../modules/email-types/email-type.enum';
import { EmailType } from '../../modules/email-types/entities/email-type.entity';

export default class CreateEmailType implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<void> {
    const count = await connection
      .createQueryBuilder()
      .select()
      .from(EmailType, 'EmailType')
      .getCount();

    if (count === 0) {
      await connection
        .createQueryBuilder()
        .insert()
        .into(EmailType)
        .values([
          { id: EmailTypeEnum.Personal, name: 'Personal' },
          { id: EmailTypeEnum.Work, name: 'Work' },
          { id: EmailTypeEnum.School, name: 'School' },
          { id: EmailTypeEnum.Business, name: 'Business' },
        ])
        .execute();
    }
  }
}
