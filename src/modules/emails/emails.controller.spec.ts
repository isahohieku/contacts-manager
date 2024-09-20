import { Test, TestingModule } from '@nestjs/testing';
import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { Email } from './entities/email.entity';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from '../../configs/database.config';
import { Contact } from '../contacts/entities/contact.entity';
import { TypeOrmConfigService } from '../../database/typeorm-config.service';

describe('EmailsController', () => {
  let controller: EmailsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EmailsController],
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

    controller = module.get<EmailsController>(EmailsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
