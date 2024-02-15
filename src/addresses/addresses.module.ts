import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { Address } from './entities/address.entity';
import { Contact } from 'src/contacts/entities/contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Address, Contact])],
  controllers: [AddressesController],
  providers: [AddressesService],
})
export class AddressesModule {}
