import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Contact } from '../contacts/entities/contact.entity';
import { User } from '../users/entity/user.entity';

import { Tag } from './entities/tag.entity';
import { TagsController } from './tags.controller';
import { TagsService } from './tags.service';

@Module({
  imports: [TypeOrmModule.forFeature([Tag, User, Contact])],
  controllers: [TagsController],
  providers: [TagsService],
})
export class TagsModule {}
