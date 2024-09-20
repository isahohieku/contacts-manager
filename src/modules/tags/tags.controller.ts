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
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

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
  create(@Request() request, @Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(request.user, createTagDto);
  }

  @Get()
  findAll(@Request() request) {
    return this.tagsService.findAll(request.user);
  }

  @Get(':id')
  findOne(@Request() request, @Param('id') id: string) {
    return this.tagsService.findOne(request.user, +id);
  }

  @Patch(':id')
  update(
    @Request() request,
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
  ) {
    return this.tagsService.update(request.user, +id, updateTagDto);
  }

  @Delete(':id')
  remove(@Request() request, @Param('id') id: string) {
    return this.tagsService.remove(request.user, +id);
  }
}
