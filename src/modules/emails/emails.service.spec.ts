import { Test, TestingModule } from '@nestjs/testing';
import { EmailsService } from './emails.service';
import { Email } from './entities/email.entity';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from '../../configs/database.config';
import { Contact } from '../contacts/entities/contact.entity';
import { TypeOrmConfigService } from '../../database/typeorm-config.service';

describe('EmailsService', () => {
  let service: EmailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailsService],
      imports: [
        TypeOrmModule.forFeature([Contact, Email]),
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

    service = module.get<EmailsService>(EmailsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
