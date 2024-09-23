import { Factory, Seeder } from 'typeorm-seeding';
import { DataSource } from 'typeorm';
import { AuthProvider } from '../../modules/auth/entities/auth-providers.entity';
import { AuthProvidersEnum } from '../../modules/auth/auth-providers.enum';

export default class CreateAuthProvider implements Seeder {
  public async run(factory: Factory, dataSource: DataSource): Promise<void> {
    const count = await dataSource
      .createQueryBuilder()
      .select()
      .from(AuthProvider, 'AuthProvider')
      .getCount();

    if (count === 0) {
      await dataSource
        .createQueryBuilder()
        .insert()
        .into(AuthProvider)
        .values([{ name: AuthProvidersEnum.EMAIL }])
        .execute();
    }
  }
}
