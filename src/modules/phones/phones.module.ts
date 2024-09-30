import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CsvModule } from 'nest-csv-parser';

import { ContactsService } from '../contacts/contacts.service';
import { Contact } from '../contacts/entities/contact.entity';
import { FileStorageService } from '../file-storage/file-storage.service';
import { FileEntity } from '../files/entities/file.entity';
import { FilesService } from '../files/files.service';
import { Tag } from '../tags/entities/tag.entity';
import { TagsService } from '../tags/tags.service';

import { Phone } from './entities/phone.entity';
import { PhonesController } from './phones.controller';
import { PhonesService } from './phones.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Phone, Contact, Tag, FileEntity]),
    CsvModule,
  ],
  controllers: [PhonesController],
  providers: [
    PhonesService,
    ContactsService,
    TagsService,
    FileStorageService,
    FilesService,
  ],
})
export class PhonesModule {}
