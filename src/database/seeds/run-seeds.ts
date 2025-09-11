import { DataSource, DataSourceOptions } from 'typeorm';

// @ts-expect-error We want to use the ormconfig.json file
import config from '../../../ormconfig.json';

// Import all seed classes
import CreateAddressType from './address-types.seed';
import CreateAuthProvider from './auth-providers.seed';
import CreateCountries from './countries.seed';
import CreateEmailType from './email-types.seed';
import CreatePhoneType from './phone-types.seed';
import CreateRole from './roles.seed';
import CreateStatus from './statuses.seed';

async function runSeeds(): Promise<void> {
  // Create DataSource using the existing ormconfig.json
  const dataSource = new DataSource(config as unknown as DataSourceOptions);

  try {
    await dataSource.initialize();
    // Define seeds in order of execution
    const seeds = [
      CreateStatus,
      CreateRole,
      CreateAuthProvider,
      CreateCountries,
      CreateAddressType,
      CreateEmailType,
      CreatePhoneType,
    ];

    // Run each seed
    for (const SeedClass of seeds) {
      const seedInstance = new SeedClass();
      // Create a mock factory (not used in current seeds)
      const mockFactory = {};

      await seedInstance.run(mockFactory, dataSource);
    }
  } catch (error) {
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

// Run the seeds
runSeeds().catch(() => {
  process.exit(1);
});
