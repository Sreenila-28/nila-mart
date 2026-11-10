#!/usr/bin/env bash
# =====================================================================
# NilaMart PostgreSQL Database Initialization Script
# =====================================================================
set -e

DB_NAME=${DB_NAME:-"nilamart"}
DB_USER=${DB_USER:-"postgres"}
DB_HOST=${DB_HOST:-"localhost"}
DB_PORT=${DB_PORT:-5432}

echo "=========================================================="
echo "  Initializing NilaMart PostgreSQL Database on ${DB_HOST}:${DB_PORT}"
echo "=========================================================="

# Check if database exists, if not create it
PGPASSWORD=${PGPASSWORD} psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -tc "SELECT 1 FROM pg_database WHERE datname = '${DB_NAME}'" | grep -q 1 || \
PGPASSWORD=${PGPASSWORD} psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -c "CREATE DATABASE ${DB_NAME};"

echo "[1/2] Applying Relational Schema (schema.sql)..."
PGPASSWORD=${PGPASSWORD} psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f database/schema.sql

echo "[2/2] Seeding Initial Data (seed.sql)..."
PGPASSWORD=${PGPASSWORD} psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -f database/seed.sql

echo "=========================================================="
echo "  NilaMart Database setup complete! Database: ${DB_NAME}"
echo "=========================================================="
