# Getting Started

This guide will help you set up and run the Contact Management API locally for development or testing purposes.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 18.x or later) - [Download Node.js](https://nodejs.org/)
- **PostgreSQL** (version 12 or later) - [Download PostgreSQL](https://www.postgresql.org/)
- **Redis** (version 6 or later) - [Download Redis](https://redis.io/)
- **Git** - [Download Git](https://git-scm.com/)
- **Yarn** (recommended) or npm - [Install Yarn](https://yarnpkg.com/)

### Optional
- **Docker** and **Docker Compose** - [Download Docker](https://www.docker.com/)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/isahohieku/contacts-manager.git
cd contacts-manager
```

### 2. Install Dependencies

```bash
# Using Yarn (recommended)
yarn install

# Or using npm
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp env-example .env
```

Edit the `.env` file with your configuration:

```env
# Application
NODE_ENV=development
APP_PORT=3000
APP_NAME="Contact Manager API"
API_PREFIX=api
APP_FALLBACK_LANGUAGE=en
APP_HEADER_LANGUAGE=x-custom-lang

# Database
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_NAME=contact_manager
DATABASE_SYNCHRONIZE=false
DATABASE_MAX_CONNECTIONS=100
DATABASE_SSL_ENABLED=false
DATABASE_REJECT_UNAUTHORIZED=false
DATABASE_CA=
DATABASE_KEY=
DATABASE_CERT=

# Redis Cache
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Authentication
AUTH_JWT_SECRET=your_jwt_secret_key
AUTH_JWT_TOKEN_EXPIRES_IN=15m
AUTH_REFRESH_SECRET=your_refresh_secret_key
AUTH_REFRESH_TOKEN_EXPIRES_IN=3650d
AUTH_FORGOT_SECRET=your_forgot_secret_key
AUTH_FORGOT_TOKEN_EXPIRES_IN=30m
AUTH_CONFIRM_EMAIL_SECRET=your_confirm_email_secret
AUTH_CONFIRM_EMAIL_TOKEN_EXPIRES_IN=1d

# Mail Configuration
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_IGNORE_TLS=true
MAIL_SECURE=false
MAIL_REQUIRE_TLS=false
MAIL_DEFAULT_EMAIL=noreply@example.com
MAIL_DEFAULT_NAME="Contact Manager API"
MAIL_CLIENT_PORT=1080

# File Storage
FILE_DRIVER=local
ACCESS_KEY_ID=
SECRET_ACCESS_KEY=
AWS_S3_REGION=
AWS_DEFAULT_S3_BUCKET=
```

### 4. Database Setup

#### Option A: Using Docker (Recommended)

Start PostgreSQL and Redis using Docker Compose:

```bash
# Start database and Redis
docker-compose up postgres redis -d

# Start mail server (for development)
docker-compose up maildev -d
```

#### Option B: Manual Setup

1. **Create PostgreSQL Database**:
   ```sql
   CREATE DATABASE contact_manager;
   ```

2. **Start Redis Server**:
   ```bash
   redis-server
   ```

### 5. Run Database Migrations

```bash
# Run migrations to set up database schema
yarn run migration:run

# Seed the database with initial data
yarn run seed:run
```

### 6. Start the Application

```bash
# Development mode with hot reload
yarn run start:dev

# Production mode
yarn run start:prod

# Debug mode
yarn run start:debug
```

The API will be available at: `http://localhost:3000`

## Verification

### 1. Health Check

Verify the application is running:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "info": {
    "database": { "status": "up" },
    "redis": { "status": "up" }
  }
}
```

### 2. API Documentation

Access the Swagger documentation:
- **URL**: [http://localhost:3000/docs](http://localhost:3000/docs)

### 3. Mail Server (Development)

If using Docker for mail:
- **MailDev UI**: [http://localhost:1080](http://localhost:1080)

## Testing

Run the test suite to ensure everything is working correctly:

```bash
# Unit tests
yarn run test

# End-to-end tests
yarn run test:e2e

# Test coverage
yarn run test:cov
```

## Common Issues

### Database Connection Issues

1. **Check PostgreSQL is running**:
   ```bash
   pg_isready -h localhost -p 5432
   ```

2. **Verify database credentials** in `.env` file

3. **Check database exists**:
   ```sql
   \l  -- List all databases
   ```

### Redis Connection Issues

1. **Check Redis is running**:
   ```bash
   redis-cli ping
   ```

2. **Verify Redis configuration** in `.env` file

### Port Already in Use

If port 3000 is already in use:

1. **Change the port** in `.env`:
   ```env
   APP_PORT=3001
   ```

2. **Or kill the process using the port**:
   ```bash
   # Find process using port 3000
   lsof -ti:3000
   
   # Kill the process
   kill -9 <PID>
   ```

## Next Steps

Now that you have the API running:

1. **Explore the API**: Visit [http://localhost:3000/docs](http://localhost:3000/docs)
2. **Read the API Reference**: [API Reference](./api-reference.md)
3. **Learn about Authentication**: [Authentication Guide](./authentication.md)
4. **Set up Development Environment**: [Development Guide](./development-guide.md)

## Development Tools

### Recommended VS Code Extensions

- **NestJS Files** - Generate NestJS files
- **TypeScript Importer** - Auto import TypeScript modules
- **Prettier** - Code formatting
- **ESLint** - Code linting
- **REST Client** - Test API endpoints

### Useful Commands

```bash
# Generate new module
nest generate module module-name

# Generate new controller
nest generate controller controller-name

# Generate new service
nest generate service service-name

# Format code
yarn run format

# Lint code
yarn run lint

# Fix linting issues
yarn run lint:fix
```
