import { Test, TestingModule } from '@nestjs/testing';
import { AddressesService } from './addresses.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Address } from './entities/address.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { AddressesController } from './addresses.controller';
import { ConfigModule } from '@nestjs/config';
import databaseConfig from '../configs/database.config';
import { TypeOrmConfigService } from '../database/typeorm-config.service';

describe('AddressesService', () => {
  let service: AddressesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AddressesController],
      providers: [AddressesService],
      imports: [
        TypeOrmModule.forFeature([Address, Contact]),
        ConfigModule.forRoot({
          isGlobal: true,
          load: [databaseConfig],
          envFilePath: ['.env'],
        }),
        TypeOrmModule.forRootAsync({
          useClass: TypeOrmConfigService,
        }),
      ],
    }).compile();

    service = module.get<AddressesService>(AddressesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
