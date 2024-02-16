import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { EmailType } from 'src/email-types/entities/email-type.entity';
import { EmailTypeEnum } from 'src/email-types/email-type.enum';

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
