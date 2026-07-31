# MySQL Setup for Smart Student System

This document describes how to install, configure, and initialize MySQL for the `smart-student-system` backend.


## Contents
- Prerequisites
- Install MySQL (Windows / macOS / Linux)
- Create database, user, and import schema
- Environment variables and example `.env`
- Docker development setup
- Verifying the connection and starting the backend

## Prerequisites
- Node.js and npm (for running the backend)
- MySQL Server 5.7+ (5.7.6+ recommended for JSON support)
- MySQL Command-Line Client or MySQL Workbench

## Install MySQL

### Windows (recommended: MySQL installer)
1. Download the installer from https://dev.mysql.com/downloads/windows/installer/
2. Run the installer and choose "MySQL Server" and "MySQL Shell" (or command-line client)
3. Accept the default port `3306` during configuration
4. Create a default MySQL user with password during setup

### Windows step-by-step (using Command Line)
- Open PowerShell as a normal user or Administrator
- If MySQL is installed, you can use the command-line client:
  ```powershell
  mysql -h localhost -u root -p
  ```
  (Enter the password you set during MySQL installation)

- ### In the MySQL prompt, create the project user and database:
  ```sql
  CREATE USER 'smart_user'@'localhost' IDENTIFIED BY 'smart_password';
  CREATE DATABASE smart_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  GRANT ALL PRIVILEGES ON smart_db.* TO 'smart_user'@'localhost';
  FLUSH PRIVILEGES;
  EXIT;
  ```

- Import the schema from the `backend` folder:
  ```powershell
  cd C:\Users\Asim sultan\Desktop\smart-student-system\backend
  mysql -h localhost -u smart_user -p smart_db < schema.sql
  ```
  (Enter the password: `smart_password`)


### macOS (Homebrew)
```bash
# Install MySQL via Homebrew
brew install mysql

# Start MySQL service
brew services start mysql

# Secure the installation (recommended)
mysql_secure_installation

# Connect to MySQL
mysql -u root

# In the MySQL prompt:
CREATE USER 'smart_user'@'localhost' IDENTIFIED BY 'smart_password';
CREATE DATABASE smart_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON smart_db.* TO 'smart_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema
mysql -h localhost -u smart_user -p smart_db < schema.sql
```

### Linux (Ubuntu/Debian)
```bash
# Install MySQL Server
sudo apt-get update
sudo apt-get install mysql-server

# Secure the installation
sudo mysql_secure_installation

# Connect to MySQL as root
sudo mysql

# In the MySQL prompt:
CREATE USER 'smart_user'@'localhost' IDENTIFIED BY 'smart_password';
CREATE DATABASE smart_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
GRANT ALL PRIVILEGES ON smart_db.* TO 'smart_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Import schema (from the backend folder)
cd ~/smart-student-system/backend
mysql -h localhost -u smart_user -p smart_db < schema.sql
```

### Linux (CentOS/RHEL)
```bash
# Install MySQL Server
sudo yum install mysql-server

# Start the service
sudo systemctl start mysqld

# Secure the installation
sudo mysql_secure_installation

# Connect and create user/database (same as Ubuntu above)
```

## Environment Variables

Create a `.env` file in the `backend` folder with the following configuration:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=smart_db
DB_USER=smart_user
DB_PASSWORD=smart_password

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
```

**Important:** Change `JWT_SECRET` to a secure random string in production.

## Docker Development Setup

If you prefer to use Docker, you can run MySQL in a container:

```bash
# Create a Docker network (optional, for multiple containers)
docker network create smart-student-network

# Run MySQL container
docker run -d \
  --name smart-mysql \
  --network smart-student-network \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=smart_db \
  -e MYSQL_USER=smart_user \
  -e MYSQL_PASSWORD=smart_password \
  -p 3306:3306 \
  mysql:8.0 \
  --character-set-server=utf8mb4 \
  --collation-server=utf8mb4_unicode_ci

# Wait for MySQL to start (usually 30 seconds)
sleep 30

# Import schema (from your host machine)
mysql -h 127.0.0.1 -u smart_user -p smart_password smart_db < schema.sql

# Or from inside the container
docker exec -i smart-mysql mysql -u smart_user -p smart_password smart_db < schema.sql
```

### Docker Compose Setup

Create a `docker-compose.yml` in the backend folder:

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    container_name: smart-mysql
    environment:
      MYSQL_ROOT_PASSWORD: rootpassword
      MYSQL_DATABASE: smart_db
      MYSQL_USER: smart_user
      MYSQL_PASSWORD: smart_password
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
      - ./schema.sql:/docker-entrypoint-initdb.d/schema.sql
    command:
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

volumes:
  mysql-data:
```

Then start with:
```bash
docker-compose up -d
```

## Verify the Connection

### Test MySQL Connection from Command Line
```bash
mysql -h localhost -u smart_user -p smart_db
```

### Test from Node.js Backend
1. Make sure your `.env` file is configured correctly
2. Start the backend:
   ```bash
   npm install
   npm dev
   ```
3. Visit `http://localhost:5000/api/health` in your browser
4. You should see: `{"status":"ok","time":"2024-01-15T10:30:45.123Z"}`

## Starting the Backend

### Development Mode
```bash
cd backend
npm install
npm run dev
```

This starts the server with `nodemon`, which auto-reloads on file changes.

### Production Mode
```bash
npm start
```

## Seeding Data

To import the sample data defined in `schema.sql`:

```bash
npm run seed
```

Or manually:
```bash
mysql -h localhost -u smart_user -p smart_db < schema.sql
```

## Troubleshooting

### Connection Refused (3306)
- Verify MySQL service is running: `mysql -u root -p`
- Check port: `netstat -an | grep 3306`
- Restart MySQL: `sudo systemctl restart mysql` (Linux) or use Services (Windows)

### Access Denied for User
- Verify credentials in `.env` match what you created
- Check user exists: `mysql -u root -p` then `SELECT user FROM mysql.user;`
- Reset password if needed

### Database Already Exists
- Drop and recreate: `DROP DATABASE smart_db; CREATE DATABASE smart_db;`
- Or change DB_NAME in `.env` and create a new database

### Character Set Issues
- Ensure `utf8mb4` collation when creating database
- Check: `SELECT CHARSET FROM information_schema.SCHEMATA WHERE SCHEMA_NAME='smart_db';`

## Next Steps

1. Configure your mobile app to connect to the backend
2. Set up JWT_SECRET for production
3. Configure CORS origin in `server.js` if needed
4. Set up logging and monitoring
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
