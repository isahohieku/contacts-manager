# System Architecture

This document describes the architecture, design patterns, and technical decisions behind the Contact Management API.

## 🏗️ High-Level Architecture

The Contact Management API follows a **layered architecture** pattern with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Controllers │  │ Guards      │  │ Interceptors        │  │
│  │ (REST API)  │  │ (Auth)      │  │ (Transform/Cache)   │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Services    │  │ DTOs        │  │ Validation Pipes    │  │
│  │ (Core Logic)│  │ (Data)      │  │ (Input Validation)  │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Data Access Layer                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Repositories│  │ Entities    │  │ Database Migrations │  │
│  │ (TypeORM)   │  │ (Models)    │  │ (Schema Changes)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Infrastructure Layer                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ PostgreSQL  │  │ Redis       │  │ File Storage        │  │
│  │ (Database)  │  │ (Cache)     │  │ (AWS S3/Local)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Design Patterns

### 1. Module Pattern (NestJS)

Each feature is organized into self-contained modules:

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Contact])],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
```

**Benefits:**

- Clear separation of concerns
- Reusable components
- Easy testing and maintenance
- Dependency injection

### 2. Repository Pattern

Data access is abstracted through TypeORM repositories:

```typescript
@Injectable()
export class ContactsService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
  ) {}

  async findAll(userId: number): Promise<Contact[]> {
    return this.contactRepository.find({ where: { userId } });
  }
}
```

**Benefits:**

- Database abstraction
- Testable data layer
- Query optimization
- Transaction management

### 3. Data Transfer Object (DTO) Pattern

Input/output data is validated and transformed using DTOs:

```typescript
export class CreateContactDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;
}
```

**Benefits:**

- Input validation
- API documentation
- Type safety
- Data transformation

### 4. Decorator Pattern

Cross-cutting concerns are handled through decorators:

```typescript
@UseGuards(AuthGuard('jwt'))
@UseInterceptors(CacheInterceptor)
@ApiOperation({ summary: 'Get all contacts' })
export class ContactsController {
  // Implementation
}
```

**Benefits:**

- Separation of concerns
- Reusable functionality
- Clean code
- Aspect-oriented programming

## 🔧 Core Components

### Authentication & Authorization

```typescript
// JWT Strategy
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('auth.secret'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    return this.userService.findById(payload.sub);
  }
}
```

**Features:**

- JWT-based authentication
- Role-based access control
- Token refresh mechanism
- Session management

### Caching Strategy

```typescript
@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get(key);
  }

  async set(key: string, value: any, ttl: number): Promise<void> {
    return this.cacheManager.set(key, value, ttl);
  }
}
```

**Implementation:**

- Redis for distributed caching
- TTL-based expiration
- Cache invalidation strategies
- Performance monitoring

### Error Handling

```typescript
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = this.getStatus(exception);
    const message = this.getMessage(exception);

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
    });
  }
}
```

**Features:**

- Global exception handling
- Structured error responses
- Logging integration
- Client-friendly messages

## 📊 Database Design

### Entity Relationships

```
User (1) ──────────── (N) Contact
                           │
                           ├── (N) Email
                           ├── (N) Phone
                           ├── (N) Address
                           ├── (N) ContactTag ── (1) Tag
                           └── (1) File (avatar)
```

### Key Entities

```typescript
@Entity()
export class Contact {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @ManyToOne(() => User, (user) => user.contacts)
  user: User;

  @OneToMany(() => Email, (email) => email.contact)
  emails: Email[];

  @OneToMany(() => Phone, (phone) => phone.contact)
  phones: Phone[];

  @OneToMany(() => Address, (address) => address.contact)
  addresses: Address[];
}
```

### Database Optimizations

1. **Indexes**: Strategic indexing on frequently queried fields
2. **Relationships**: Proper foreign key constraints
3. **Migrations**: Version-controlled schema changes
4. **Connection Pooling**: Optimized database connections

## 🚀 Performance Optimizations

### 1. Caching Strategy

```typescript
// Service-level caching
@Injectable()
export class ContactsService {
  async findOne(id: number): Promise<Contact> {
    const cacheKey = `contact:${id}`;

    // Check cache first
    const cached = await this.cacheService.get(cacheKey);
    if (cached) return cached;

    // Fetch from database
    const contact = await this.contactRepository.findOne({ where: { id } });

    // Cache result
    await this.cacheService.set(cacheKey, contact, 300);

    return contact;
  }
}
```

### 2. Database Query Optimization

```typescript
// Efficient queries with proper joins
async findAllWithRelations(userId: number): Promise<Contact[]> {
  return this.contactRepository
    .createQueryBuilder('contact')
    .leftJoinAndSelect('contact.emails', 'emails')
    .leftJoinAndSelect('contact.phones', 'phones')
    .leftJoinAndSelect('contact.addresses', 'addresses')
    .where('contact.userId = :userId', { userId })
    .getMany();
}
```

### 3. Response Compression

```typescript
// Compression middleware
app.use(
  compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    level: 6,
    threshold: 1024,
  }),
);
```

## 🔒 Security Architecture

### 1. Authentication Flow

```
Client Request → JWT Guard → JWT Strategy → User Validation → Route Handler
```

### 2. Security Middleware Stack

```typescript
// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }),
);

// Rate limiting
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
  }),
);
```

### 3. Input Validation

```typescript
// DTO validation
export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 50)
  firstName: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
```

## 📈 Scalability Considerations

### 1. Horizontal Scaling

- Stateless application design
- Redis for shared session storage
- Load balancer compatibility

### 2. Database Scaling

- Read replicas for query distribution
- Connection pooling
- Query optimization

### 3. Caching Strategy

- Multi-level caching (application + database)
- Cache invalidation patterns
- Distributed caching with Redis

### 4. File Storage

- AWS S3 for scalable file storage
- CDN integration for global distribution
- Optimized file upload/download

## 🔄 Data Flow

### 1. Request Processing Flow

```
HTTP Request → Middleware → Guards → Interceptors → Controller → Service → Repository → Database
                ↓
HTTP Response ← Serialization ← Interceptors ← Service Response ← Query Result ← Database
```

### 2. Authentication Flow

```
Login Request → Validation → Password Check → JWT Generation → Response
                                    ↓
Subsequent Requests → JWT Validation → User Context → Route Access
```

### 3. Caching Flow

```
Request → Cache Check → Cache Hit? → Return Cached Data
            ↓ (Cache Miss)
        Database Query → Store in Cache → Return Data
```

## 🧪 Testing Architecture

### 1. Testing Pyramid

```
E2E Tests (Integration)
    ↑
Unit Tests (Services, Controllers)
    ↑
Component Tests (Modules)
```

### 2. Test Structure

```typescript
// Unit test example
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
    // Test implementation
  });
});
```

## 📦 Deployment Architecture

### 1. Container Strategy

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
EXPOSE 3000
CMD ["node", "dist/main"]
```

### 2. Environment Configuration

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - postgres
      - redis
```

## 🔮 Future Considerations

### 1. Microservices Migration

- Service decomposition strategy
- API gateway implementation
- Inter-service communication

### 2. Event-Driven Architecture

- Event sourcing patterns
- Message queues (RabbitMQ/Kafka)
- Asynchronous processing

### 3. Advanced Caching

- Cache warming strategies
- Distributed cache invalidation
- Cache analytics and monitoring

### 4. Real-time Features

- WebSocket integration
- Real-time notifications
- Live data synchronization
