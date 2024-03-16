import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { EmailsController } from './emails.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Email } from './entities/email.entity';
import { Contact } from '../contacts/entities/contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Email, Contact])],
  controllers: [EmailsController],
  providers: [EmailsService],
})
export class EmailsModule {}
