# Sweety – Blood Glucose Tracker

A small full-stack application built with React, Node.js, Express and PostgreSQL. Patients can securely sign up, record up to four glucose readings per day, edit/delete readings, and view daily, month-to-date and previous-month summaries.

## Requirements

- Node.js 20 or newer (LTS recommended)
- PostgreSQL 14 or newer
- Git (for submitting to GitHub)

## Project structure

- `client/` – React + Vite frontend
- `server/` – Express REST API, authentication, database setup and seed script
- `.env.example` – environment variable template

## 1. Create the database

Open PostgreSQL (pgAdmin or SQL Shell) and run:

```sql
CREATE DATABASE sweety_glucose;
```

The server automatically creates the `users` and `readings` tables when it starts.

## 2. Configure environment

Create `server/.env` by copying the root `.env.example`. Update the PostgreSQL password and JWT secret:

```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_POSTGRES_PASSWORD@localhost:5432/sweety_glucose
JWT_SECRET=use_a_long_random_secret_here
CLIENT_URL=http://localhost:5173
```

Do not commit `server/.env`. It is ignored by Git.

## 3. Install dependencies

From the project root:

```bash
npm install
npm --prefix server install
npm --prefix client install
```

## 4. Start the app

Open two terminals in VS Code.

Terminal 1 (API):

```bash
npm run dev --prefix server
```

Terminal 2 (React website):

```bash
npm run dev --prefix client
```

Open http://localhost:5173 in your browser. The API health check is at http://localhost:5000/api/health.

## 5. Demo account

After configuring the database, run:

```bash
npm run seed --prefix server
```

Demo login:
- Email: `demo@sweety.test`
- Password: `DemoPass123!`

Change or remove this demo account before using the app with real personal health data.

## API overview

All protected endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create patient account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Current account |
| GET | `/api/readings` | List own readings |
| POST | `/api/readings` | Add a reading |
| PUT | `/api/readings/:id` | Edit own reading |
| DELETE | `/api/readings/:id` | Delete own reading |
| GET | `/api/reports?date=YYYY-MM-DD` | Daily, month-to-date and previous-month summaries |

## Validation and security

- Passwords are hashed with bcrypt (12 salt rounds); plain-text passwords are never stored.
- JWT authentication protects patient data routes.
- Every reading query is scoped to the authenticated user's ID.
- Reading values must be whole numbers from 40 through 600 mg/dL.
- A patient can have one reading per time slot per date and no more than four readings per day.
- Future dates and invalid slots are rejected.
- PostgreSQL also enforces the unique user/date/slot constraint and value range.

## Tests

Run the validation unit tests:

```bash
npm test --prefix server
```

## Assumptions and notes

- The four requested time slots are fixed and use the exact labels in the assignment.
- A reading date is interpreted as a calendar date in the user's local context; the API stores it as PostgreSQL `DATE`.
- "Monthly" means the entire previous calendar month, while "Month-to-date" runs from the first day of the selected month through the selected date.
- Reports show highest, lowest, average (one decimal place) and count. Empty periods show a friendly empty state.
- This submission focuses on required patient features. Optional pagination, charts, Docker, Redis caching, background jobs and doctor-to-patient assignment are not included.
- For a production deployment, add HTTPS, stronger rate limiting, refresh-token/session management, database backups, audit logging, and clinical privacy/security review. This demo is not a medical device and does not provide medical advice.

## GitHub submission

1. Create a **public** repository on GitHub named `sweety-glucose-tracker`.
2. In VS Code, open the project root terminal and run:

```bash
git init
git add .
git commit -m "Create Sweety project structure"
git add .
git commit -m "Build authentication and glucose reading API"
git add .
git commit -m "Build React dashboard and reports"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sweety-glucose-tracker.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username. If Git says there is nothing to commit on one of the later commits, make a small meaningful change before committing; do not create fake or misleading commits.

## Recording checklist

Record a 2–3 minute walkthrough showing:
1. Register a new user and log in.
2. Add readings for different slots.
3. Edit and delete a reading.
4. Show the daily, month-to-date and previous-month report cards.
5. Show one validation error (for example, a value below 40).
6. Log out.
