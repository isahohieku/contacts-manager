import { Test, TestingModule } from '@nestjs/testing';
import { PhonesController } from './phones.controller';
import { PhonesService } from './phones.service';
import { Phone } from './entities/phone.entity';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from '../configs/database.config';
import { Contact } from '../contacts/entities/contact.entity';
import { TypeOrmConfigService } from '../database/typeorm-config.service';

describe('PhonesController', () => {
  let controller: PhonesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PhonesController],
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

    controller = module.get<PhonesController>(PhonesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
