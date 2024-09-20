import { Module } from '@nestjs/common';
import { PhonesService } from './phones.service';
import { PhonesController } from './phones.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from '../contacts/entities/contact.entity';
import { Phone } from './entities/phone.entity';
import { Tag } from '../tags/entities/tag.entity';
import { ContactsService } from '../contacts/contacts.service';
import { TagsService } from '../tags/tags.service';
import { FileStorageService } from '../file-storage/file-storage.service';
import { FilesService } from '../files/files.service';
import { FileEntity } from '../files/entities/file.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Phone, Contact, Tag, FileEntity])],
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
