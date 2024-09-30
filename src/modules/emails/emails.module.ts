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

import { EmailsController } from './emails.controller';
import { EmailsService } from './emails.service';
import { Email } from './entities/email.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Email, Contact, Tag, FileEntity]),
    CsvModule,
  ],
  controllers: [EmailsController],
  providers: [
    EmailsService,
    ContactsService,
    TagsService,
    FilesService,
    FileStorageService,
  ],
})
export class EmailsModule {}
