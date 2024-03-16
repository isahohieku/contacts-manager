import { Test, TestingModule } from '@nestjs/testing';
import { TagsService } from './tags.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from '../configs/database.config';
import { TypeOrmConfigService } from '../database/typeorm-config.service';
import { Tag } from './entities/tag.entity';

describe('TagsService', () => {
  let service: TagsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TagsService],
      imports: [
        TypeOrmModule.forFeature([Tag]),
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

    service = module.get<TagsService>(TagsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
