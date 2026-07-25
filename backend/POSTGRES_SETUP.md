# PostgreSQL Setup for Smart Student System

This document describes how to install, configure, and initialize PostgreSQL for the `smart-student-system` backend.

Contents
- Prerequisites
- Install PostgreSQL (Windows / macOS / Linux)
- Create database, user, and import schema
- Environment variables and example `.env`
- Docker development setup
- Verifying the connection and starting the backend

Prerequisites
- Node.js and npm (for running the backend)
- `psql` client or Docker

Install PostgreSQL

Windows (recommended: PostgreSQL installer)
1. Download the installer from https://www.postgresql.org/download/windows/
2. Run the installer and note the superuser password (default `postgres`).
3. Add PostgreSQL's `bin` folder to your `PATH` if you want to use `psql` from PowerShell.

macOS (Homebrew)
```bash
brew install postgresql
brew services start postgresql
```

Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl enable --now postgresql
```

Create Database, Role (User), and Import Schema

Open a terminal and switch to the `postgres` user or use `psql` directly.

Create a database and role (replace values as appropriate):
```bash
# Login as postgres superuser
sudo -u postgres psql

-- inside psql
CREATE ROLE smart_user WITH LOGIN PASSWORD 'smart_password';
CREATE DATABASE smart_db OWNER smart_user;
GRANT ALL PRIVILEGES ON DATABASE smart_db TO smart_user;
\q
```

Import the schema provided by this project:

Use the project's `schema.sql` file: [backend/schema.sql](backend/schema.sql)

```bash
# from the repo root
psql -h localhost -U smart_user -d smart_db -f backend/schema.sql
```

Environment Variables

Create a `.env` file in the `backend` folder (or set system environment variables). Example variables:

```
PGHOST=localhost
PGPORT=5432
PGUSER=smart_user
PGPASSWORD=smart_password
PGDATABASE=smart_db
# Optional: a single connection URL
DATABASE_URL=postgres://smart_user:smart_password@localhost:5432/smart_db
```

The backend database connection is configured in [backend/config/db.js](backend/config/db.js). Update it or use the `DATABASE_URL` environment variable if preferred.

Docker Development Setup

If you prefer Docker, run a local Postgres container:

```bash
docker run --name sss-postgres -e POSTGRES_USER=smart_user -e POSTGRES_PASSWORD=smart_password -e POSTGRES_DB=smart_db -p 5432:5432 -d postgres:15
```

After the container is running, import the schema:

```bash
docker cp backend/schema.sql sss-postgres:/schema.sql
docker exec -it sss-postgres psql -U smart_user -d smart_db -f /schema.sql
```

Verifying the Connection

Use `psql` or a GUI (pgAdmin, DBeaver) to connect using the credentials above. Example with `psql`:

```bash
psql -h localhost -U smart_user -d smart_db
SELECT NOW();
\q
```

Starting the Backend with the DB

From the `backend` folder, install deps and start the server (example):

```bash
cd backend
npm install
# Ensure env vars are set, then
npm start
```

Troubleshooting
- If connection is refused, confirm Postgres is running and listening on `0.0.0.0` or `localhost`.
- Check `PGPORT` and firewall rules that may block `5432`.
- Confirm credentials and database name match the `.env` values.

Extras / Notes
- If you prefer a migration tool, consider adding `node-pg-migrate`, `sequelize-cli`, or `knex` later.
- For production, use a managed Postgres (Heroku, AWS RDS, Supabase) and secure credentials via secrets.

If you want, I can also add a link to this file in the main `README.md`.
