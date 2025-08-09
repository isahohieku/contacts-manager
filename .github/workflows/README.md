# GitHub Workflows Documentation

This directory contains the CI/CD workflows for the Contact List API project. The workflows are designed to provide comprehensive testing, quality assurance, and deployment automation.

## Workflow Overview

### 1. Quality Check (`quality-check.yml`)

**Triggers:**
- Push to any branch (except main/develop)
- Pull request opened/updated

**Purpose:** Fast feedback for development branches

**Jobs:**
- **quality-check**: ESLint, Prettier, TypeScript compilation, unit tests, security audit
- **security-analysis**: Security vulnerabilities, dependency analysis (PR only)
- **code-quality**: Unit test coverage, complexity analysis (PR only)

**Duration:** ~3-5 minutes

### 2. Continuous Integration (`integration.yml`)

**Triggers:**
- Push to main, develop, release/*, hotfix/* branches
- Pull requests to main/develop
- Manual workflow dispatch

**Purpose:** Comprehensive testing and validation

**Jobs:**
1. **lint-and-typecheck**: Code quality and type safety
2. **unit-tests**: Fast unit tests with coverage
3. **integration-tests**: Database integration tests
4. **e2e-tests**: Full application testing (conditional)
5. **coverage-report**: Merged coverage analysis

**Duration:** ~15-25 minutes

### 3. Deploy (`deploy.yml`)

**Triggers:**
- Push to main branch (staging)
- Git tags (production)
- Manual workflow dispatch

**Purpose:** Automated deployment pipeline

**Jobs:**
1. **pre-deployment-tests**: Critical tests before deployment
2. **build-and-push**: Docker image build and registry push
3. **deploy-staging**: Staging environment deployment
4. **deploy-production**: Production deployment (tags only)
5. **rollback**: Automatic rollback on failure

**Duration:** ~10-20 minutes

## Test Scripts

The workflows use the following npm scripts:

### Unit Tests
```bash
yarn test:unit          # Run unit tests
yarn test:unit:cov      # Run unit tests with coverage
```

### Integration Tests
```bash
yarn test:integration       # Run integration tests
yarn test:integration:cov   # Run integration tests with coverage
```

### E2E Tests
```bash
yarn test:e2e          # Run e2e tests
yarn test:e2e:cov      # Run e2e tests with coverage
```

### Coverage Merging
```bash
yarn test:cov:merge    # Merge all coverage reports
```

### Quality Checks
```bash
yarn lint              # ESLint
yarn prettier:check    # Prettier formatting check
yarn build             # TypeScript compilation
yarn audit             # Security audit
```

## Coverage Reports

The workflows generate and merge coverage from three sources:

1. **Unit Tests**: Fast, isolated component testing
2. **Integration Tests**: Database and service integration
3. **E2E Tests**: Full application workflow testing

Coverage reports are:
- Uploaded to Codecov with separate flags
- Merged into a comprehensive report
- Commented on pull requests
- Stored as artifacts for 30 days

## Environment Configuration

### Required Secrets

#### Database
- `DATABASE_TYPE`
- `DATABASE_HOST`
- `DATABASE_PORT`
- `DATABASE_USERNAME`
- `DATABASE_PASSWORD`
- `DATABASE_NAME`

#### Authentication
- `AUTH_JWT_SECRET`
- `AUTH_JWT_TOKEN_EXPIRES_IN`

#### Mail Service
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USER`
- `MAIL_PASSWORD`
- `MAIL_DEFAULT_EMAIL`

#### File Storage
- `FILE_DRIVER`
- `ACCESS_KEY_ID`
- `SECRET_ACCESS_KEY`
- `AWS_S3_REGION`
- `AWS_DEFAULT_S3_BUCKET`

#### Coverage
- `CODECOV_TOKEN`

### Environment Files

The workflows create appropriate `.env` files for different contexts:
- CI environments use test databases
- E2E tests use Docker Compose services
- Integration tests use GitHub Actions services

## Workflow Strategy

### Branch Strategy
- **Feature branches**: Quality check only (fast feedback)
- **Main/Develop**: Full CI pipeline
- **Release branches**: Full CI + deployment preparation
- **Tags**: Full CI + production deployment

### Test Strategy
- **Unit tests**: Always run (fast feedback)
- **Integration tests**: Run on important branches
- **E2E tests**: Run on main branches and PRs
- **Coverage**: Comprehensive reporting and tracking

### Deployment Strategy
- **Staging**: Automatic on main branch
- **Production**: Manual or tag-triggered
- **Rollback**: Automatic on deployment failure

## Performance Optimizations

1. **Caching**: Node.js dependencies cached between runs
2. **Parallel Jobs**: Tests run in parallel for faster feedback
3. **Conditional Execution**: E2E tests skip on draft PRs
4. **Artifact Management**: Coverage files shared between jobs
5. **Docker Layer Caching**: Build cache for faster image builds

## Monitoring and Notifications

- **Coverage Reports**: Automatic PR comments
- **Test Results**: Detailed job summaries
- **Deployment Status**: Environment-specific notifications
- **Failure Alerts**: Immediate notification on critical failures

## Usage Examples

### Running Full Test Suite Manually
```bash
# Trigger comprehensive CI
gh workflow run integration.yml

# Trigger with specific options
gh workflow run integration.yml -f run_full_suite=true
```

### Deploying to Staging
```bash
# Deploy current main to staging
gh workflow run deploy.yml -f environment=staging
```

### Emergency Production Deployment
```bash
# Skip tests and deploy directly
gh workflow run deploy.yml -f environment=production -f skip_tests=true
```

## Troubleshooting

### Common Issues

1. **Test Timeouts**: Increase timeout values in jest configurations
2. **Database Connection**: Check service health in integration tests
3. **Coverage Upload**: Verify Codecov token and file paths
4. **Docker Build**: Check Dockerfile and build context

### Debug Commands

```bash
# Local test execution
yarn test:unit:cov
yarn test:integration:cov
yarn test:e2e:cov
yarn test:cov:merge

# Docker E2E testing
docker-compose -f docker-compose.ci.yaml up --build
```

## Maintenance

### Regular Tasks
- Update Node.js version in workflows
- Review and update dependencies
- Monitor workflow execution times
- Update coverage thresholds
- Review security audit results

### Workflow Updates
When modifying workflows:
1. Test changes on feature branches
2. Validate with workflow dispatch
3. Monitor first production run
4. Update documentation
