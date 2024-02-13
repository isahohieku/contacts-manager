import { Module } from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { ContactsController } from './contacts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from './entities/contact.entity';
import { Phone } from 'src/phones/entities/phone.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contact, Phone])],
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
