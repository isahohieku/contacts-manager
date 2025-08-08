import { DataSource, DataSourceOptions } from 'typeorm';

import config from '../../../ormconfig.json';

// Import all seed classes
import CreateAddressType from './address-types.seed';
import CreateAuthProvider from './auth-providers.seed';
import CreateCountries from './countries.seed';
import CreateEmailType from './email-types.seed';
import CreatePhoneType from './phone-types.seed';
import CreateRole from './roles.seed';
import CreateStatus from './statuses.seed';

async function runSeeds() {
  console.log('🌱 Starting database seeding...');

  // Create DataSource using the existing ormconfig.json
  const dataSource = new DataSource(config as unknown as DataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('📦 Database connection established');

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
      console.log(`🌱 Running ${SeedClass.name}...`);

      // Create a mock factory (not used in current seeds)
      const mockFactory = {} as any;

      await seedInstance.run(mockFactory, dataSource);
      console.log(`✅ ${SeedClass.name} completed`);
    }

    console.log('🎉 All seeds completed successfully!');
  } catch (error) {
    console.error('❌ Error running seeds:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

// Run the seeds
runSeeds().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
