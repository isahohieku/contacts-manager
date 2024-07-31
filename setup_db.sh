#!/bin/bash
set -e

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL to be ready..."
echo "${POSTGRES_USER} is ${DATABASE_USERNAME}"
until pg_isready -U $POSTGRES_USER; do
  sleep 1
done

# Check if the database exists and create it if it does not
echo "Creating database ${POSTGRES_DB} if it does not already exist..."
psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
  DO \$\$
  BEGIN
    IF NOT EXISTS (SELECT FROM pg_database WHERE datname = '$POSTGRES_DB') THEN
      CREATE DATABASE $POSTGRES_DB;
    END IF;
  END
  \$\$;
EOSQL

echo "PostgreSQL database setup complete."
