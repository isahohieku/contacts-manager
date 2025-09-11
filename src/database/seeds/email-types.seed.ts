import { DataSource } from 'typeorm';

import { EmailTypeEnum } from '../../modules/email-types/email-type.enum';
import { EmailType } from '../../modules/email-types/entities/email-type.entity';

export default class CreateEmailType {
  public async run(factory: unknown, dataSource: DataSource): Promise<void> {
    const count = await dataSource
      .createQueryBuilder()
      .select()
      .from(EmailType, 'EmailType')
      .getCount();

    if (count === 0) {
      await dataSource
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
