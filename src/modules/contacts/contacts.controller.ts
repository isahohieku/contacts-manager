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
  Response,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response as Res } from 'express';
import { memoryStorage } from 'multer';

import { fileFilter } from '@contactApp/shared/utils/file-filter';
import { SearchTypes } from '@contactApp/shared/utils/types/contacts.type';

import { User } from '../users/entity/user.entity';

import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@ApiTags('Contacts')
@Controller({
  path: 'contacts',
  version: '1',
})
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new contact',
    description:
      'Creates a new contact for the authenticated user with the provided details including name, organization, job title, and optional avatar.',
  })
  @ApiResponse({
    status: 201,
    description: 'Contact created successfully',
    schema: {
      example: {
        data: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          organization: 'Tech Corp',
          job_title: 'Software Engineer',
          createdAt: '2023-12-01T10:00:00Z',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Request() request: any, @Body() createContactDto: CreateContactDto) {
    return this.contactsService.create(request.user as User, createContactDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all contacts with pagination and search',
    description:
      'Retrieves a paginated list of contacts for the authenticated user with optional search and filtering capabilities.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search term for contact name, email, or phone',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: String,
    description: 'Number of items per page (max 50)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: String,
    description: 'Page number (starts from 1)',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: SearchTypes,
    description: 'Search type filter',
  })
  @ApiResponse({
    status: 200,
    description: 'Contacts retrieved successfully',
    schema: {
      example: {
        data: [
          {
            id: 1,
            firstName: 'John',
            lastName: 'Doe',
            organization: 'Tech Corp',
            emails: [{ email: 'john@example.com' }],
          },
        ],
        metadata: {
          page: 1,
          limit: 10,
          total: 100,
          totalPages: 10,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(
    @Request() request: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
    @Query('search') search: string,
    @Query('type') type: SearchTypes,
  ) {
    if (limit > 50) {
      limit = 50;
    }

    return await this.contactsService.findAllWithPagination(
      {
        page,
        limit,
      },
      search,
      type,
      request.user as User,
    );
  }

  @Get('export')
  @ApiOperation({
    summary: 'Export contacts to CSV',
    description:
      'Exports all contacts or a specific contact to CSV format for the authenticated user.',
  })
  @ApiQuery({
    name: 'id',
    required: false,
    type: String,
    description: 'Optional contact ID to export specific contact',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file generated successfully',
    headers: {
      'Content-Type': { description: 'text/csv' },
      'Content-Disposition': {
        description: 'attachment; filename=contacts.csv',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async exportContacts(
    @Request() request: any,
    @Response() res: Res,
    @Query('id') id?: string,
  ) {
    const csvContacts = await this.contactsService.exportContacts(
      request.user as User,
      id ? +id : undefined,
    );

    res.header('Content-Type', 'text/csv');
    res.attachment('contacts.csv');
    res.send(csvContacts);
  }

  @Post('import')
  @ApiOperation({
    summary: 'Import contacts from CSV',
    description:
      'Imports contacts from a CSV file for the authenticated user. The CSV should have columns for firstName, lastName, email, phone, etc.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'CSV file containing contact data',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file with contact data',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Contacts imported successfully',
    schema: {
      example: {
        data: {
          imported: 25,
          failed: 2,
          errors: [
            'Row 3: Invalid email format',
            'Row 7: Missing required field firstName',
          ],
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid file format or content' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      fileFilter,
    }),
  )
  async importContacts(@Request() request: any, @UploadedFile() file: any) {
    return await this.contactsService.importContacts(
      request.user as User,
      file,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get contact by ID',
    description:
      'Retrieves a specific contact by its ID for the authenticated user.',
  })
  @ApiParam({ name: 'id', description: 'Contact ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Contact retrieved successfully',
    schema: {
      example: {
        data: {
          id: 1,
          firstName: 'John',
          lastName: 'Doe',
          organization: 'Tech Corp',
          emails: [{ email: 'john@example.com' }],
          phones: [{ phone: '+1234567890' }],
          addresses: [{ street: '123 Main St', city: 'New York' }],
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findOne(@Request() request: any, @Param('id') id: string) {
    return this.contactsService.findOne(request.user as User, +id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update contact',
    description: 'Updates an existing contact with the provided data.',
  })
  @ApiParam({ name: 'id', description: 'Contact ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Contact updated successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  update(
    @Request() request: any,
    @Param('id') id: string,
    @Body() updateContactDto: UpdateContactDto,
  ) {
    return this.contactsService.update(
      request.user as User,
      +id,
      updateContactDto,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete contact',
    description: 'Permanently deletes a contact and all associated data.',
  })
  @ApiParam({ name: 'id', description: 'Contact ID', type: 'number' })
  @ApiResponse({ status: 200, description: 'Contact deleted successfully' })
  @ApiResponse({ status: 404, description: 'Contact not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  remove(@Request() request: any, @Param('id') id: string) {
    return this.contactsService.remove(request.user, +id);
  }
}
