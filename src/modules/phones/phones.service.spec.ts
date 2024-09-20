import { Test, TestingModule } from '@nestjs/testing';
import { PhonesService } from './phones.service';
import { Phone } from './entities/phone.entity';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from '../../configs/database.config';
import { Contact } from '../contacts/entities/contact.entity';
import { TypeOrmConfigService } from '../../database/typeorm-config.service';

describe('PhonesService', () => {
  let service: PhonesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PhonesService],
      imports: [
        TypeOrmModule.forFeature([Contact, Phone]),
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

    service = module.get<PhonesService>(PhonesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
