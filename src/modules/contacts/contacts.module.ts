import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import { Phone } from '../phones/entities/phone.entity';
import { Tag } from '../tags/entities/tag.entity';
import { Email } from '../emails/entities/email.entity';
import { TagsService } from '../tags/tags.service';
import { FilesService } from '../files/files.service';
import { FileStorageService } from '../file-storage/file-storage.service';
import { FileEntity } from '../files/entities/file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contact, Phone, Tag, Email, FileEntity])],
  controllers: [ContactsController],
  providers: [ContactsService, TagsService, FilesService, FileStorageService],
})
export class ContactsModule {}
