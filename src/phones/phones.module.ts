import { Module } from '@nestjs/common';
import { PhonesService } from './phones.service';
import { PhonesController } from './phones.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from '../contacts/entities/contact.entity';
import { Phone } from './entities/phone.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contact, Phone])],
  controllers: [PhonesController],
  providers: [PhonesService],
})
export class PhonesModule {}
