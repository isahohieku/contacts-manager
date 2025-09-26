# Development Guide

This guide covers development practices, code organization, and contribution guidelines for the Contact Management API.

## 🏗️ Project Structure

```
src/
├── app.module.ts              # Main application module
├── main.ts                    # Application entry point
├── common/                    # Shared utilities and components
│   ├── cache/                 # Cache-related utilities
│   ├── decorators/            # Custom decorators
│   ├── filters/               # Exception filters
│   ├── guards/                # Authentication guards
│   ├── interceptors/          # Request/response interceptors
│   ├── middleware/            # Custom middleware
│   ├── pipes/                 # Validation pipes
│   └── services/              # Shared services
├── config/                    # Configuration files
├── database/                  # Database-related files
│   ├── migrations/            # Database migrations
│   ├── seeds/                 # Database seeders
│   └── scripts/               # Database scripts
├── modules/                   # Feature modules
│   ├── auth/                  # Authentication module
│   ├── contacts/              # Contact management
│   ├── users/                 # User management
│   ├── files/                 # File management
│   └── ...                    # Other modules
└── shared/                    # Shared entities and utilities
    ├── entities/              # Base entities
    ├── translations/          # Internationalization
    └── utils/                 # Utility functions
```

## 🛠️ Development Setup

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- Docker (optional but recommended)

### Environment Setup

1. **Clone and install dependencies**:

   ```bash
   git clone https://github.com/isahohieku/contacts-manager.git
   cd contacts-manager
   yarn install
   ```

2. **Set up environment variables**:

   ```bash
   cp env-example .env
   # Edit .env with your configuration
   ```

3. **Start development services**:

   ```bash
   # Using Docker (recommended)
   docker-compose up postgres redis maildev -d

   # Or start services manually
   # PostgreSQL, Redis, and MailDev
   ```

4. **Initialize database**:

   ```bash
   yarn run migration:run
   yarn run seed:run
   ```

5. **Start development server**:
   ```bash
   yarn run start:dev
   ```

## 📝 Coding Standards

### TypeScript Configuration

The project uses strict TypeScript configuration:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### Code Style

- **Prettier**: Automatic code formatting
- **ESLint**: Code linting and best practices
- **Naming Conventions**:
  - Classes: PascalCase (`UserService`)
  - Methods/Variables: camelCase (`findUser`)
  - Constants: UPPER_SNAKE_CASE (`MAX_FILE_SIZE`)
  - Files: kebab-case (`user-service.ts`)

### File Organization

```typescript
// 1. External imports
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';

// 2. Internal imports (absolute paths)
import { User } from '@contactApp/modules/users/entities/user.entity';
import { CreateUserDto } from '@contactApp/modules/users/dto/create-user.dto';

// 3. Relative imports
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {
  // Implementation
}
```

## 🏛️ Architecture Patterns

### Module Structure

Each feature module follows this structure:

```
module-name/
├── dto/                       # Data Transfer Objects
│   ├── create-entity.dto.ts
│   ├── update-entity.dto.ts
│   └── query-entity.dto.ts
├── entities/                  # Database entities
│   └── entity.entity.ts
├── guards/                    # Module-specific guards
├── interceptors/              # Module-specific interceptors
├── entity.controller.ts       # REST controller
├── entity.service.ts          # Business logic
├── entity.repository.ts       # Data access (if needed)
├── entity.module.ts           # Module definition
└── entity.controller.spec.ts  # Tests
```

### Service Layer Pattern

```typescript
@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
    private readonly cacheService: CacheService,
    private readonly logger: LoggerService,
  ) {}

  async create(user: User, dto: CreateContactDto): Promise<Contact> {
    // 1. Validate input
    // 2. Transform data
    // 3. Save to database
    // 4. Update cache
    // 5. Log operation
    // 6. Return result
  }
}
```

### Repository Pattern

```typescript
@Injectable()
export class ContactRepository extends Repository<Contact> {
  async findByUserWithRelations(userId: number): Promise<Contact[]> {
    return this.createQueryBuilder('contact')
      .leftJoinAndSelect('contact.emails', 'emails')
      .leftJoinAndSelect('contact.phones', 'phones')
      .leftJoinAndSelect('contact.addresses', 'addresses')
      .where('contact.userId = :userId', { userId })
      .getMany();
  }
}
```

## 🧪 Testing Strategy

### Test Structure

```
test/
├── unit/                      # Unit tests
├── integration/               # Integration tests
├── e2e/                       # End-to-end tests
├── utils/                     # Test utilities
└── mock-data/                 # Test data
```

### Unit Testing

```typescript
describe('ContactsService', () => {
  let service: ContactsService;
  let repository: Repository<Contact>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: getRepositoryToken(Contact),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
    repository = module.get<Repository<Contact>>(getRepositoryToken(Contact));
  });

  it('should create a contact', async () => {
    // Arrange
    const user = mockUser();
    const dto = mockCreateContactDto();

    // Act
    const result = await service.create(user, dto);

    // Assert
    expect(result).toBeDefined();
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining(dto));
  });
});
```

### E2E Testing

```typescript
describe('Contacts (e2e)', () => {
  let app: INestApplication;
  let token: string;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get authentication token
    token = await getAuthToken(app);
  });

  it('/contacts (POST)', () => {
    return request(app.getHttpServer())
      .post('/contacts')
      .set('Authorization', `Bearer ${token}`)
      .send(mockContactData)
      .expect(201)
      .expect((res) => {
        expect(res.body.data.firstName).toBe(mockContactData.firstName);
      });
  });
});
```

## 🔧 Development Tools

### Useful Commands

```bash
# Development
yarn run start:dev          # Start with hot reload
yarn run start:debug        # Start in debug mode

# Testing
yarn run test               # Run unit tests
yarn run test:watch         # Run tests in watch mode
yarn run test:e2e           # Run e2e tests
yarn run test:cov           # Generate coverage report

# Code Quality
yarn run lint               # Run ESLint
yarn run lint:fix           # Fix ESLint issues
yarn run format             # Format code with Prettier

# Database
yarn run migration:generate # Generate new migration
yarn run migration:run      # Run migrations
yarn run migration:revert   # Revert last migration
yarn run seed:run           # Run database seeds

# Build
yarn run build             # Build for production
yarn run start:prod        # Start production build
```

### VS Code Configuration

Create `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  }
}
```

### Recommended Extensions

- **NestJS Files** - Generate NestJS boilerplate
- **TypeScript Importer** - Auto import management
- **Prettier** - Code formatting
- **ESLint** - Code linting
- **REST Client** - API testing
- **GitLens** - Git integration
- **Thunder Client** - API testing

## 📊 Performance Guidelines

### Database Optimization

1. **Use indexes** for frequently queried fields
2. **Implement pagination** for large datasets
3. **Use query builders** for complex queries
4. **Avoid N+1 queries** with proper joins

```typescript
// Good: Single query with joins
const contacts = await this.contactRepository
  .createQueryBuilder('contact')
  .leftJoinAndSelect('contact.emails', 'emails')
  .leftJoinAndSelect('contact.phones', 'phones')
  .where('contact.userId = :userId', { userId })
  .getMany();

// Bad: N+1 queries
const contacts = await this.contactRepository.find({ where: { userId } });
for (const contact of contacts) {
  contact.emails = await this.emailRepository.find({ contactId: contact.id });
}
```

### Caching Strategy

```typescript
@Injectable()
export class ContactsService {
  async findOne(id: number): Promise<Contact> {
    const cacheKey = `contact:${id}`;

    // Try cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const contact = await this.contactRepository.findOne({ where: { id } });

    // Cache result
    await this.cacheService.set(cacheKey, contact, 300); // 5 minutes

    return contact;
  }
}
```

## 🚀 Deployment

### Environment Configuration

```bash
# Production environment variables
NODE_ENV=production
APP_PORT=3000
DATABASE_SSL_ENABLED=true
REDIS_PASSWORD=your_redis_password
AUTH_JWT_SECRET=your_strong_jwt_secret
```

### Docker Deployment

```dockerfile
# Multi-stage build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["node", "dist/main"]
```

## 🤝 Contributing

### Git Workflow

1. **Create feature branch**: `git checkout -b feature/new-feature`
2. **Make changes** following coding standards
3. **Write tests** for new functionality
4. **Run tests**: `yarn run test && yarn run test:e2e`
5. **Commit changes**: Use conventional commits
6. **Push branch**: `git push origin feature/new-feature`
7. **Create pull request**

### Commit Convention

```bash
feat: add contact search functionality
fix: resolve authentication token expiry issue
docs: update API documentation
test: add unit tests for contact service
refactor: improve database query performance
```

### Pull Request Guidelines

- **Clear description** of changes
- **Link to related issues**
- **Include tests** for new features
- **Update documentation** if needed
- **Ensure CI passes**

## 📚 Additional Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [TypeORM Documentation](https://typeorm.io/)
- [Jest Testing Framework](https://jestjs.io/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/documentation)
