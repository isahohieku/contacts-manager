# Testing Strategy

This project uses a comprehensive testing strategy with three distinct types of tests:

## Test Types

### 1. Unit Tests (`*.spec.ts`)

- **Purpose**: Test individual components/services in isolation
- **Location**: `src/**/*.spec.ts`
- **Characteristics**:
  - Mock all external dependencies
  - Fast execution
  - Focus on business logic
  - No database or external service connections

### 2. Integration Tests (`*.integration.spec.ts`)

- **Purpose**: Test multiple components working together
- **Location**: `src/**/*.integration.spec.ts` or `test/**/*.integration.spec.ts`
- **Characteristics**:
  - Use real database connections (in-memory for speed)
  - Test service interactions
  - Verify data persistence
  - Mock only external services (email, file storage, etc.)

### 3. End-to-End Tests (`*.e2e-spec.ts`)

- **Purpose**: Test complete user workflows through HTTP API
- **Location**: `test/**/*.e2e-spec.ts`
- **Characteristics**:
  - Full application bootstrap
  - Real HTTP requests
  - Test complete user journeys
  - Use test database

## Running Tests

### All Tests

```bash
npm run test
```

### Unit Tests Only

```bash
npm run test:unit
npm run test:unit:watch    # Watch mode
npm run test:unit:cov      # With coverage
npm run test:unit:debug    # Debug mode
```

### Integration Tests Only

```bash
npm run test:integration
npm run test:integration:watch    # Watch mode
npm run test:integration:cov      # With coverage
npm run test:integration:debug    # Debug mode
```

### E2E Tests Only

```bash
npm run test:e2e
npm run test:e2e:watch    # Watch mode
npm run test:e2e:cov      # With coverage
npm run test:e2e:debug    # Debug mode
```

## Test File Naming Conventions

- **Unit tests**: `*.spec.ts` (e.g., `auth.service.spec.ts`)
- **Integration tests**: `*.integration.spec.ts` (e.g., `auth.service.integration.spec.ts`)
- **E2E tests**: `*.e2e-spec.ts` (e.g., `auth.e2e-spec.ts`)

## Configuration Files

- `jest-unit.json` - Unit test configuration
- `jest-integration.json` - Integration test configuration
- `jest-e2e.json` - E2E test configuration
- `package.json` - Main Jest configuration with projects

## Best Practices

### Unit Tests

- Mock all external dependencies
- Test edge cases and error conditions
- Keep tests fast and isolated
- Focus on single responsibility

### Integration Tests

- Use in-memory database when possible
- Test real service interactions
- Verify data persistence and retrieval
- Mock only truly external services

### E2E Tests

- Test complete user workflows
- Use realistic test data
- Test authentication and authorization
- Verify API contracts

## Coverage

Each test type has separate coverage reporting:

- Unit tests focus on business logic coverage
- Integration tests focus on service interaction coverage
- E2E tests focus on API endpoint coverage

Run `npm run test:cov` for combined coverage or specific coverage with `test:unit:cov`, `test:integration:cov`, or `test:e2e:cov`.
