#!/bin/bash
set -e

echo "🚀 Starting CI test execution..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
/opt/wait-for-it.sh postgres:5432 --timeout=60 --strict -- echo "✅ PostgreSQL is ready"

# Wait for MailDev to be ready
echo "⏳ Waiting for MailDev to be ready..."
/opt/wait-for-it.sh maildev:1080 --timeout=30 --strict -- echo "✅ MailDev is ready"

# Run database migrations and seeds
echo "🔄 Running database migrations..."
yarn run migration:run

echo "🌱 Running database seeds..."
yarn run seed:run

# Start the application in the background
echo "🚀 Starting the application..."
yarn start:prod &
APP_PID=$!

# Wait for the application to be ready
echo "⏳ Waiting for application to be ready..."
/opt/wait-for-it.sh localhost:3000 --timeout=60 --strict -- echo "✅ Application is ready"

# Give the app a moment to fully initialize
sleep 5

# Run E2E tests with coverage
echo "🧪 Running E2E tests with coverage..."
yarn run test:e2e:cov

# Capture the test exit code
TEST_EXIT_CODE=$?

# Stop the application
echo "🛑 Stopping the application..."
kill $APP_PID 2>/dev/null || true

# Wait for the application to stop
wait $APP_PID 2>/dev/null || true

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All E2E tests passed successfully!"
else
    echo "❌ E2E tests failed with exit code $TEST_EXIT_CODE"
fi

# Exit with the test result
exit $TEST_EXIT_CODE
