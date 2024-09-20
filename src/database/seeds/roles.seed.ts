import { Factory, Seeder } from 'typeorm-seeding';
import { Connection } from 'typeorm';
import { Role } from '../../modules/roles/entities/role.entity';

export default class CreateRole implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<void> {
    const countUser = await connection
      .createQueryBuilder()
      .select()
      .from(Role, 'Role')
      .where('"Role"."id" = :id', { id: 2 })
      .getCount();

    if (countUser === 0) {
      await connection
        .createQueryBuilder()
        .insert()
        .into(Role)
        .values([{ id: 2, name: 'User' }])
        .execute();
    }

    const countAdmin = await connection
      .createQueryBuilder()
      .select()
      .from(Role, 'Role')
      .where('"Role"."id" = :id', { id: 1 })
      .getCount();

    if (countAdmin === 0) {
      await connection
        .createQueryBuilder()
        .insert()
        .into(Role)
        .values([{ id: 1, name: 'Admin' }])
        .execute();
    }
  }
}
