# Trade Auditor Pro

Fullstack day trade audit platform — MVP V1.

## Stack
- **Frontend:** Next.js 15 (App Router) · Tailwind-like custom CSS · TypeScript
- **Backend:** NestJS · TypeScript
- **Database:** PostgreSQL 16 · Prisma ORM
- **Container:** Docker Compose

## Quick Start (Docker)

```bash
# 1. Clone the repo and enter it
cd auditor-trade

# 2. Copy env file
cp .env.example .env

# 3. Build and start all services
docker-compose up --build

# 4. Open the app
open http://localhost:3000
```

## Services
| Service | Port | URL |
|---------|------|-----|
| Frontend (Next.js) | 3000 | http://localhost:3000 |
| API (NestJS) | 3001 | http://localhost:3001/api |
| Database (Postgres) | 5432 | localhost:5432 |

## First Use
1. Go to http://localhost:3000 → redirects to /login
2. Click "Criar conta" to register
3. Navigate to **Importações** → upload `docs/sample-trades.csv`
4. Wait for status "Concluído" then go to **Dashboard**
5. See P&L chart and 3 insight cards appear

## Development (local, no Docker)

```bash
# Install dependencies
pnpm install

# Start Postgres (keep Docker running just for the DB)
docker-compose up postgres -d

# Start API
cd apps/api
pnpm dev

# Start Frontend (new terminal)
cd apps/web
pnpm dev
```

## Project Structure
```
auditor-trade/
├── apps/
│   ├── api/           # NestJS backend
│   │   ├── src/
│   │   │   ├── auth/
│   │   │   ├── imports/
│   │   │   ├── analytics/
│   │   │   ├── insights/
│   │   │   ├── plans/
│   │   │   ├── prop/
│   │   │   └── journal/
│   │   └── prisma/schema.prisma
│   └── web/           # Next.js frontend
│       └── src/app/
│           ├── dashboard/
│           ├── imports/
│           ├── analytics/
│           ├── insights/
│           ├── planner/
│           ├── prop/
│           └── journal/
├── docs/
│   ├── prd.md
│   ├── design-system.md
│   └── sample-trades.csv   ← use this to test import
├── docker-compose.yml
└── .env
```

## API Endpoints
All endpoints require authentication (JWT cookie from `/api/auth/login`).

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Login |
| POST | /api/auth/logout | Logout |
| GET | /api/auth/me | Current user |
| POST | /api/imports | Upload CSV/XLSX |
| GET | /api/imports | List imports |
| GET | /api/analytics/overview | Daily P&L summary |
| GET | /api/analytics/by-symbol | Per-symbol stats |
| GET | /api/analytics/heatmap | Time-bucket heatmap |
| GET | /api/analytics/by-weekday | Weekday performance |
| GET | /api/insights | 3 AI-computed insights |
| GET | /api/plans/active | Active trade plan |
| POST | /api/plans | Create trade plan |
| GET | /api/plans/violations | Plan violation list |
| POST | /api/prop-challenges | Create prop challenge |
| GET | /api/prop-challenges/:id/plan | Approval plan |
| GET | /api/prop-challenges/:id/progress | Challenge progress |
| POST | /api/journal | Save journal entry |
| GET | /api/journal | List journal entries |
