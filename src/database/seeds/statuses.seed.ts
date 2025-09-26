import { DataSource } from 'typeorm';

import { Status } from '../../modules/statuses/entities/status.entity';
import { StatusEnum } from '../../modules/statuses/statuses.enum';

export default class CreateStatus {
  public async run(factory: unknown, dataSource: DataSource): Promise<void> {
    const count = await dataSource
      .createQueryBuilder()
      .select()
      .from(Status, 'Status')
      .getCount();

    if (count === 0) {
      await dataSource
        .createQueryBuilder()
        .insert()
        .into(Status)
        .values([
          { id: StatusEnum.active, name: 'Active' },
          { id: StatusEnum.inactive, name: 'Inactive' },
        ])
        .execute();
    }
  }
}
