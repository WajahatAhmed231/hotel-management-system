# Hotel Management System (HMS)

A full-stack web application for managing hotel operations — built with React, Node.js/Express, and PostgreSQL.

---

## Project Structure

```
hotel-management-system/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── app.js        # Entry point
│   │   ├── config/       # Database config
│   │   ├── controllers/  # Business logic
│   │   ├── middleware/   # Auth middleware
│   │   └── routes/       # API routes
│   ├── database/
│   │   └── schema.sql    # PostgreSQL schema + seed data
│   ├── .env.example
│   └── package.json
│
└── frontend/             # React + Vite + Tailwind CSS
    ├── src/
    │   ├── pages/        # All page components
    │   ├── components/   # Shared UI components
    │   ├── context/      # Auth context
    │   ├── services/     # Axios API service
    │   └── App.jsx       # Routes
    └── package.json
```

---

## Prerequisites

- Node.js v18+
- PostgreSQL v14+
- npm or yarn

---

## Setup Instructions

### 1. Database Setup

```bash
# Create the database and run schema
psql -U postgres -f backend/database/schema.sql
```

> **Note:** The seed script creates a default admin user. Update the bcrypt hash in `schema.sql` with a real hash before deploying to production. Use the register endpoint or update via psql after setup.

### 2. Backend Setup

```bash
cd backend
npm install

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your database credentials and JWT secret

npm run dev     # Development (with nodemon)
npm start       # Production
```

Backend runs on: `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev     # Development
npm run build   # Production build
```

Frontend runs on: `http://localhost:3000`

---

## Default Login

After running the schema, create your first admin user via the API:

```bash
# First, manually insert an admin with a proper bcrypt hash, or use:
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@hotel.com","password":"admin123","role":"admin"}'
```

> The `/api/auth/register` endpoint requires an authenticated admin. For first-time setup, temporarily remove the auth middleware from that route or insert directly into the database.

---

## API Endpoints

| Module         | Method | Endpoint                          |
|----------------|--------|-----------------------------------|
| Auth           | POST   | /api/auth/login                   |
| Auth           | POST   | /api/auth/register (admin only)   |
| Auth           | GET    | /api/auth/me                      |
| Rooms          | GET    | /api/rooms                        |
| Rooms          | POST   | /api/rooms                        |
| Rooms          | PUT    | /api/rooms/:id                    |
| Rooms          | DELETE | /api/rooms/:id                    |
| Rooms          | GET    | /api/rooms/availability           |
| Room Types     | GET    | /api/rooms/types                  |
| Guests         | GET    | /api/guests                       |
| Guests         | POST   | /api/guests                       |
| Guests         | PUT    | /api/guests/:id                   |
| Reservations   | GET    | /api/reservations                 |
| Reservations   | POST   | /api/reservations                 |
| Reservations   | PUT    | /api/reservations/:id             |
| Reservations   | POST   | /api/reservations/:id/checkin     |
| Reservations   | POST   | /api/reservations/:id/checkout    |
| Billing        | GET    | /api/billing/invoices             |
| Billing        | POST   | /api/billing/invoices             |
| Billing        | POST   | /api/billing/payments             |
| Housekeeping   | GET    | /api/housekeeping                 |
| Housekeeping   | POST   | /api/housekeeping                 |
| Housekeeping   | PUT    | /api/housekeeping/:id             |
| Staff          | GET    | /api/staff                        |
| Staff          | PUT    | /api/staff/:id                    |
| Dashboard      | GET    | /api/reports/dashboard            |
| Reports        | GET    | /api/reports/occupancy            |
| Reports        | GET    | /api/reports/revenue              |
| Reports        | GET    | /api/reports/bookings             |

---

## User Roles & Permissions

| Feature            | Admin | Manager | Receptionist | Housekeeping |
|--------------------|-------|---------|--------------|--------------|
| Dashboard          | ✅    | ✅      | ✅           | ✅           |
| Rooms (view)       | ✅    | ✅      | ✅           | ✅           |
| Rooms (edit)       | ✅    | ✅      | ✅           | ❌           |
| Rooms (delete)     | ✅    | ❌      | ❌           | ❌           |
| Guests             | ✅    | ✅      | ✅           | ❌           |
| Reservations       | ✅    | ✅      | ✅           | ❌           |
| Check-in/out       | ✅    | ❌      | ✅           | ❌           |
| Billing            | ✅    | ✅      | ✅           | ❌           |
| Housekeeping       | ✅    | ✅      | ✅           | ✅           |
| Staff Management   | ✅    | ✅      | ❌           | ❌           |
| Reports            | ✅    | ✅      | ❌           | ❌           |

---

## Development Milestones (SRS Phases)

- [x] Phase 1 — Authentication + User Roles
- [x] Phase 2 — Room Management + Guest Management
- [x] Phase 3 — Reservation System
- [x] Phase 4 — Check-in / Check-out
- [x] Phase 5 — Billing System
- [x] Phase 6 — Housekeeping Module
- [x] Phase 7 — Reports & Dashboard

---

## Tech Stack

| Layer      | Technology              |
|------------|-------------------------|
| Frontend   | React 18, Vite, Tailwind CSS |
| Charts     | Recharts                |
| Icons      | Heroicons               |
| Backend    | Node.js, Express.js     |
| Database   | PostgreSQL               |
| Auth       | JWT (jsonwebtoken)       |
| HTTP       | Axios                   |
