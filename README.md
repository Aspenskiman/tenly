# Tenly

> **Stop asking "How are you doing?" — start knowing.**

Tenly gives leaders a simple, shared language for human connection. After every 1:1, you log a Tenly score (1–10). Over time, those numbers reveal who's thriving and who needs attention — before it's too late.

## Philosophy

"What's your Tenly score this week?" is a completely different interaction than "How are you doing?" — it invites honesty, creates shared language, and gives the leader a specific number to probe.

**The score is always logged by the leader after a real conversation — never by the employee.** This is a core product decision, not an oversight.

---

## Quick Start (Local)

### Prerequisites
- Docker + Docker Compose
- Node.js 20+

### 1. Clone and configure
```bash
git clone https://github.com/YOUR_USERNAME/tenly.git
cd tenly
cp .env.example server/.env
# Edit server/.env with your values
```

### 2. Start with Docker Compose
```bash
docker-compose up -d
```

### 3. Run migrations and seed
```bash
cd server
npm install
npx prisma migrate deploy
npm run db:seed
```

### 4. Open the app
- Frontend: http://localhost:5173
- Backend health: http://localhost:3000/health

---

## Seed Credentials

| Role      | Email                  | Password   |
|-----------|------------------------|------------|
| Executive | exec@acme.com          | password   |
| Manager 1 | manager1@acme.com      | password   |
| Manager 2 | manager2@acme.com      | password   |
| Manager 3 | manager3@acme.com      | password   |

**Seed data highlights:**
- Company: Acme Corp
- 3 teams, 11 team members
- 90 days of happiness entries
- **Bob Nguyen** — clear downward trend last 14 days
- **Frank Torres** — clear upward trend last 14 days

---

## Environment Variables

### Server (`server/.env`)

| Variable               | Description                                    | Example                        |
|------------------------|------------------------------------------------|--------------------------------|
| `DATABASE_URL`         | PostgreSQL connection string                   | `postgresql://user:pass@host/db` |
| `JWT_SECRET`           | Secret for access token signing                | 64+ random bytes               |
| `JWT_REFRESH_SECRET`   | Secret for refresh token signing               | Different 64+ random bytes     |
| `NODE_ENV`             | Environment                                    | `development` / `production`   |
| `PORT`                 | Server port                                    | `3000`                         |
| `EMAIL_TRANSPORT`      | Email delivery (`console` or `smtp`)           | `console`                      |
| `CLIENT_URL`           | Frontend URL for CORS (production)             | `https://tenly.vercel.app`     |

### Client (`client/.env` or Vercel env)

| Variable        | Description              | Example                              |
|-----------------|--------------------------|--------------------------------------|
| `VITE_API_URL`  | Backend base URL         | `https://tenly-api.onrender.com`     |

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18 + TypeScript + Vite            |
| Styling   | Tailwind CSS                            |
| Charts    | Recharts                                |
| Backend   | Node.js + Express + TypeScript          |
| Database  | PostgreSQL + Prisma ORM                 |
| Auth      | JWT (15min) + Refresh tokens (7 days), httpOnly cookies |
| Email     | Nodemailer (console transport for dev)  |
| Scheduler | node-cron (weekly digest, Mondays 7am ET) |

---

## API Endpoints

### Auth
| Method | Endpoint              | Description                  | Auth     |
|--------|-----------------------|------------------------------|----------|
| POST   | `/api/auth/register`  | Create account + company     | None     |
| POST   | `/api/auth/login`     | Login, set httpOnly cookies  | None     |
| POST   | `/api/auth/logout`    | Clear tokens                 | Required |
| POST   | `/api/auth/refresh`   | Rotate refresh token         | Cookie   |
| GET    | `/api/auth/me`        | Get current user             | Required |

### Teams (Manager)
| Method | Endpoint                              | Description         |
|--------|---------------------------------------|---------------------|
| GET    | `/api/teams/my`                       | Get manager's teams |
| POST   | `/api/teams`                          | Create team         |
| POST   | `/api/teams/:teamId/members`          | Add member          |
| DELETE | `/api/teams/members/:memberId`        | Archive member      |
| POST   | `/api/teams/members/:memberId/entries`| Log happiness score |
| GET    | `/api/teams/members/:memberId/entries`| Get member history  |

### Executive (Read-only)
| Method | Endpoint              | Description                |
|--------|-----------------------|----------------------------|
| GET    | `/api/company/teams`  | All teams across company   |
| GET    | `/api/company/entries`| Company-wide happiness data|

---

## Project Structure

```
tenly/
├── client/                 # React + Vite + TypeScript
│   └── src/
│       ├── api/            # Axios API layer + interceptors
│       ├── components/     # Layout, Navbar, ProtectedRoute
│       ├── context/        # AuthContext
│       ├── hooks/          # (extendable)
│       └── pages/          # Login, Register, Dashboard, Executive
├── server/
│   ├── prisma/
│   │   ├── schema.prisma   # 5 models + RefreshToken
│   │   └── seed.ts         # 90 days realistic data
│   └── src/
│       ├── controllers/    # auth, team, member, entry
│       ├── middleware/     # auth, rateLimiter, validate, errorHandler
│       ├── routes/         # auth, teams, executive
│       ├── services/       # trendService, emailService, schedulerService
│       └── types/          # AuthRequest, AuthPayload
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Deployment

### Backend → Render
1. Connect GitHub repo to Render
2. Set build command: `npm install && npx prisma generate && npm run build`
3. Set start command: `npm start`
4. Add env vars (DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, NODE_ENV=production, CLIENT_URL)
5. After first deploy: run `npx prisma migrate deploy && npm run db:seed`

### Frontend → Vercel
1. Connect GitHub repo, set root to `client/`
2. Build command: `npm run build`, output: `dist/`
3. Add env var: `VITE_API_URL=https://your-backend.onrender.com`
