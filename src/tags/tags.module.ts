import { Module } from '@nestjs/common';
import { TagsService } from './tags.service';
import { TagsController } from './tags.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tag } from './entities/tag.entity';
import { User } from 'src/users/entity/user.entity';
import { Contact } from 'src/contacts/entities/contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, User, Contact])],
  controllers: [TagsController],
  providers: [TagsService],
})
export class TagsModule {}
