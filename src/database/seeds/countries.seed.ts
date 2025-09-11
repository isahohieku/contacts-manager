import { DataSource } from 'typeorm';

import { countryCodes } from '../../modules/countries/countries';
import { Country } from '../../modules/countries/entities/country.entity';

export default class CreateCountries {
  public async run(factory: unknown, dataSource: DataSource): Promise<void> {
    const count = await dataSource
      .createQueryBuilder()
      .select()
      .from(Country, 'Country')
      .getCount();

    if (count === 0) {
      await dataSource
        .createQueryBuilder()
        .insert()
        .into(Country)
        .values(countryCodes)
        .execute();
    }
  }
}
