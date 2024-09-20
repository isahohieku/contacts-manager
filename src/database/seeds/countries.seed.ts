import { Factory, Seeder } from 'typeorm-seeding';
//TODO: Fix deprecation
import { Connection } from 'typeorm';
import { Country } from '../../modules/countries/entities/country.entity';
import { countryCodes } from '../../modules/countries/countries';

export default class CreateCountries implements Seeder {
  public async run(factory: Factory, connection: Connection): Promise<void> {
    const count = await connection
      .createQueryBuilder()
      .select()
      .from(Country, 'Country')
      .getCount();

    if (count === 0) {
      await connection
        .createQueryBuilder()
        .insert()
        .into(Country)
        .values(countryCodes)
        .execute();
    }
  }
}
