import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { User } from '../users/entity/user.entity';

import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Tag } from './entities/tag.entity';
import { TagsService } from './tags.service';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Tags')
@Controller({
  path: 'tags',
  version: '1',
})
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  create(
    @Request() request: { user: User },
    @Body() createTagDto: CreateTagDto,
  ): Promise<Tag> {
    return this.tagsService.create(request.user, createTagDto);
  }

  @Get()
  findAll(@Request() request: { user: User }): Promise<Tag[]> {
    return this.tagsService.findAll(request.user);
  }

  @Get(':id')
  findOne(
    @Request() request: { user: User },
    @Param('id') id: string,
  ): Promise<Tag> {
    return this.tagsService.findOne(request.user, +id);
  }

  @Patch(':id')
  update(
    @Request() request: { user: User },
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<Tag> {
    return this.tagsService.update(request.user, +id, updateTagDto);
  }

  @Delete(':id')
  remove(
    @Request() request: { user: User },
    @Param('id') id: string,
  ): Promise<Tag> {
    return this.tagsService.remove(request.user, +id);
  }
}
