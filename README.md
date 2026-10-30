# RemindMe Service Center

RemindMe is a car service-center management application for managing customers, vehicles, service history, bookings, invoices, reminders, reports, and staff accounts.

The project contains:

- **Frontend:** React 19, TypeScript, Vite, Redux Toolkit
- **Backend:** Node.js, Express, TypeScript, Prisma
- **Database:** PostgreSQL
- **Database runtime:** Docker Compose

## Project structure

```text
remindme/
├── client/                 # React/Vite frontend
├── server/                 # Express API
├── docker-compose.yml      # PostgreSQL container
└── README.md
```

## Prerequisites

Install the following software:

1. [Git for Windows](https://git-scm.com/download/win)
2. [Node.js LTS](https://nodejs.org/)
3. [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/)

Docker Desktop must be running before starting PostgreSQL.

Verify the installations in PowerShell:

```powershell
git --version
node --version
npm --version
docker --version
docker compose version
```

Node.js 20 or newer is recommended.

## Clone or open the project

If the project has not been cloned yet:

```powershell
git clone https://github.com/mahesh95-git/remindme-service-center.git
cd remindme-service-center
```

For an existing local checkout:

```powershell
cd C:\Users\hp\Desktop\project\remindme
```

## Start PostgreSQL with Docker

The PostgreSQL configuration is defined in [`docker-compose.yml`](./docker-compose.yml).

Start the database:

```powershell
docker compose up -d postgres
```

Check the container:

```powershell
docker compose ps
```

The default local database configuration is:

```text
Host:     localhost
Port:     5432
Database: car_service_reminder
Username: postgres
Password: postgres
```

The PostgreSQL container is named `remindme-postgres`.

Stop the database without deleting data:

```powershell
docker compose stop postgres
```

Start it again:

```powershell
docker compose start postgres
```

Stop and remove the container:

```powershell
docker compose down
```

To remove the container and all local database data:

```powershell
docker compose down -v
```

> The `-v` option permanently deletes the local PostgreSQL volume.

## Configure the backend

Create `server/.env` if it does not already exist:

```powershell
cd server
New-Item .env -ItemType File
```

Add the following values:

```env
PORT=5000
NODE_ENV=development

DATABASE_URL=postgresql://postgres:postgres@localhost:5432/car_service_reminder
JWT_SECRET=replace-this-with-a-long-random-secret
CLIENT_URL=http://localhost:5173

REMINDER_CRON=0 8 * * *
REMINDER_TIMEZONE=Asia/Kolkata
REMINDER_LEAD_DAYS=30,15,7,1
```

### Optional email settings

Email reminders require SMTP configuration. For Gmail, use a Gmail App Password rather than your normal Gmail password:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM="RemindMe <your-email@gmail.com>"
```

Never commit `.env` files, passwords, JWT secrets, SMTP credentials, or other secrets to Git.

## Install backend dependencies

From the repository root:

```powershell
cd server
npm install
```

Generate the Prisma client:

```powershell
npm run prisma:generate
```

## Create the database schema

Run the project's SQL migration:

```powershell
npm run db:migrate
```

This executes [`server/src/db/schema.sql`](./server/src/db/schema.sql) and creates the required tables, enums, indexes, and default service data.

The available Prisma database command is:

```powershell
npm run prisma:push
```

For a normal initial setup, use `npm run db:migrate`.

## Create the first administrator

There is no public registration page. The first administrator must be created directly in the database. After the first administrator logs in, additional staff members can be created from the Staff page.

Make sure the migration has completed, then run this command from the `server` directory. Replace the example credentials before using the application:

```powershell
node --input-type=module -e "import bcrypt from 'bcrypt'; import pg from 'pg'; import 'dotenv/config'; const { Pool } = pg; const name = 'System Administrator'; const email = 'admin@remindme.local'; const password = 'ChangeThisPassword123!'; const passwordHash = await bcrypt.hash(password, 10); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); await pool.query('INSERT INTO users (name, email, password_hash, role, is_active, created_at, updated_at) VALUES ($1, $2, $3, ''ADMIN'', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, password_hash = EXCLUDED.password_hash, role = ''ADMIN'', is_active = true, updated_at = CURRENT_TIMESTAMP', [name, email, passwordHash]); await pool.end(); console.log('Administrator account created or updated successfully.');"
```

The example command creates or updates:

```text
Email:    admin@remindme.local
Password: ChangeThisPassword123!
Role:     ADMIN
```

Change the password immediately for any real deployment.

## Start the backend

Open a PowerShell window:

```powershell
cd C:\Users\hp\Desktop\project\remindme\server
npm run dev
```

The API runs at:

```text
http://localhost:5000
```

Check the API health endpoint:

```powershell
Invoke-WebRequest http://localhost:5000/api/health
```

Or open [http://localhost:5000/api/health](http://localhost:5000/api/health) in a browser.

Expected response:

```json
{
  "status": "ok",
  "orm": "prisma",
  "timestamp": "..."
}
```

## Install frontend dependencies

Open a second PowerShell window:

```powershell
cd C:\Users\hp\Desktop\project\remindme\client
npm install
```

The frontend uses `http://localhost:5000/api` during development by default.

To set the API URL explicitly, create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Restart Vite after changing frontend environment variables.

## Start the frontend

From the `client` directory:

```powershell
npm run dev
```

Open:

```text
http://localhost:5173
```

Sign in using the administrator credentials created above.

## Normal development workflow

Use three PowerShell windows.

### Terminal 1: PostgreSQL

```powershell
cd C:\Users\hp\Desktop\project\remindme
docker compose up -d postgres
```

### Terminal 2: Backend

```powershell
cd C:\Users\hp\Desktop\project\remindme\server
npm run dev
```

### Terminal 3: Frontend

```powershell
cd C:\Users\hp\Desktop\project\remindme\client
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Create staff accounts

Only an authenticated administrator can manage staff accounts.

After logging in:

1. Open the **Staff** page.
2. Select **Add staff member**.
3. Enter the staff member's name, email, and password.
4. Choose a role:
   - `ADMIN` for trusted administrators
   - `RECEPTIONIST` for normal service-center staff
5. Save the account.

The staff-management API is protected by the administrator role.

## Available npm scripts

### Backend scripts

Run from `server/`:

```powershell
npm run dev             # Start the development API with watch mode
npm run build           # Type-check and compile the backend
npm start               # Start the compiled backend
npm run db:migrate      # Run the SQL database migration
npm run prisma:generate # Generate the Prisma client
npm run prisma:push     # Push the Prisma schema to the database
```

### Frontend scripts

Run from `client/`:

```powershell
npm run dev     # Start the Vite development server
npm run build   # Type-check and build the frontend
npm run preview # Preview the production frontend build
```

## Production builds

Build the backend:

```powershell
cd server
npm run build
npm start
```

Build the frontend:

```powershell
cd client
npm run build
npm run preview
```

For production, use a strong `JWT_SECRET`, production database credentials, a production `CLIENT_URL`, and properly configured SMTP credentials. Do not use the example administrator password or default PostgreSQL password in production.

## Troubleshooting

### Docker or PostgreSQL is not running

```powershell
docker compose up -d postgres
docker compose ps
```

Confirm Docker Desktop is open and its engine is running.

### Port 5432 is already in use

Find the process using the port:

```powershell
netstat -ano | findstr :5432
```

If you change the host port in `docker-compose.yml`, update `DATABASE_URL` to use the same port. For example, if the host port becomes `5433`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/car_service_reminder
```

### Backend cannot connect to PostgreSQL

Check:

```powershell
docker compose ps
```

Then verify that `server/.env` contains:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/car_service_reminder
```

### Frontend cannot reach the API

Check that the backend is running and that this URL responds:

```text
http://localhost:5000/api/health
```

Then verify `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Restart the frontend after changing the file.

### Login fails

Confirm that:

1. The database migration completed successfully.
2. The administrator creation command completed successfully.
3. The email and password match exactly.
4. The backend and admin-creation command use the same `DATABASE_URL`.
5. The administrator account is active.

### Reinstall dependencies

```powershell
cd server
npm install

cd ..\client
npm install
```

### Reset the local development database

> This deletes all local database records.

```powershell
cd C:\Users\hp\Desktop\project\remindme
docker compose down -v
docker compose up -d postgres

cd server
npm run db:migrate
```

After resetting the database, create the administrator account again.

## Security notes

- Keep `server/.env` and `client/.env` private.
- Use a long, random `JWT_SECRET`.
- Use unique passwords for all staff accounts.
- Do not use the default PostgreSQL password outside local development.
- Do not use the example administrator credentials in production.
- Use Gmail App Passwords or another dedicated SMTP credential for email notifications.
