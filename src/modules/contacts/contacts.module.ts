import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CsvModule } from 'nest-csv-parser';

import { Email } from '../emails/entities/email.entity';
import { FileStorageService } from '../file-storage/file-storage.service';
import { FileEntity } from '../files/entities/file.entity';
import { FilesService } from '../files/files.service';
import { Phone } from '../phones/entities/phone.entity';
import { Tag } from '../tags/entities/tag.entity';
import { TagsService } from '../tags/tags.service';

import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { Contact } from './entities/contact.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Contact, Phone, Tag, Email, FileEntity]),
    CsvModule,
  ],
  controllers: [ContactsController],
  providers: [ContactsService, TagsService, FilesService, FileStorageService],
})
export class ContactsModule {}
