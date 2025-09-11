import { DataSource } from 'typeorm';

import { Role } from '../../modules/roles/entities/role.entity';

export default class CreateRole {
  public async run(factory: unknown, dataSource: DataSource): Promise<void> {
    const countUser = await dataSource
      .createQueryBuilder()
      .select()
      .from(Role, 'Role')
      .where('"Role"."id" = :id', { id: 2 })
      .getCount();

    if (countUser === 0) {
      await dataSource
        .createQueryBuilder()
        .insert()
        .into(Role)
        .values([{ id: 2, name: 'User' }])
        .execute();
    }

    const countAdmin = await dataSource
      .createQueryBuilder()
      .select()
      .from(Role, 'Role')
      .where('"Role"."id" = :id', { id: 1 })
      .getCount();

    if (countAdmin === 0) {
      await dataSource
        .createQueryBuilder()
        .insert()
        .into(Role)
        .values([{ id: 1, name: 'Admin' }])
        .execute();
    }
  }
}
