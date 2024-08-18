import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Email } from './entities/email.entity';
import { Contact } from '../contacts/entities/contact.entity';
import { ContactsService } from '../contacts/contacts.service';
import { TagsService } from '../tags/tags.service';
import { Tag } from '../tags/entities/tag.entity';
import { FilesService } from '../files/files.service';
import { FileStorageService } from '../file-storage/file-storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([Email, Contact, Tag])],
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
