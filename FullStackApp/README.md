# DevOps Full Stack Task Manager

A full stack task management application with an Express + MongoDB REST API, a React frontend, and complete Docker support.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, React Router |
| Backend | Node.js, Express 4, Mongoose |
| Database | MongoDB 7 |
| Runtime | Docker Compose |
| Tests | Mocha, Chai, Supertest |

## Features

- JWT-based registration and login
- Task CRUD with status, priority, due dates, and tags
- Task search and filtering
- Completion stats dashboard
- Rate limiting and validation
- Health check endpoint
- Multi-service Docker deployment

## Project Structure

```
FullStackApp/
├── backend/
│   ├── src/
│   │   ├── config/          # Database connection
│   │   ├── controllers/     # Request handlers
│   │   ├── middleware/      # Auth, errors, 404
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # API routes
│   │   └── utils/           # Helpers and seed script
│   ├── tests/               # Integration tests
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             # API client
│   │   ├── components/      # UI components
│   │   ├── context/         # Auth context
│   │   ├── hooks/           # Data hooks
│   │   └── styles/          # Global CSS
│   ├── Dockerfile
│   └── nginx.conf           # SPA + API proxy config
└── docker-compose.yml
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/users/register` | Create a new account |
| POST | `/api/users/login` | Log in and get a JWT |
| GET | `/api/users/me` | Get current user |
| PATCH | `/api/users/profile` | Update profile |
| PATCH | `/api/users/password` | Change password |

### Tasks (protected)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks (supports `status`, `priority`, `search`, pagination) |
| POST | `/api/tasks` | Create a task |
| GET | `/api/tasks/:id` | Get a single task |
| PATCH | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| PATCH | `/api/tasks/:id/complete` | Mark a task completed |
| GET | `/api/tasks/stats` | Status counts |
| GET | `/api/tasks/due-soon` | Tasks due within N hours |

### System
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health and uptime status |

## Running with Docker

The whole stack runs with three containers: MongoDB, backend API, and the nginx-served frontend.

```bash
# From the FullStackApp directory
docker-compose up --build
```

Services:

- Frontend: http://localhost
- Backend API: http://localhost:5000
- Health check: http://localhost:5000/api/health

Useful commands:

```bash
docker-compose ps                # service status
docker-compose logs -f backend   # follow backend logs
docker-compose down              # stop services
docker-compose down -v           # stop and remove the data volume
docker-compose up -d --scale frontend=2   # scale the frontend
```

## Running Without Docker

### Backend

```bash
cd backend
npm install
cp .env.example .env   # set MONGO_URI and JWT_SECRET
npm run dev            # needs a local MongoDB
npm test               # integration tests
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:3000, proxies /api to :5000
npm run build
```

### Seeding sample data

```bash
cd backend
npm run seed
```

Demo credentials after seeding:

- `harshit@example.com` / `password123`
- `dev@example.com` / `password123`

## Environment Variables (backend)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `5000` | API port |
| `MONGO_URI` | `mongodb://localhost:27017/taskmanager` | MongoDB connection |
| `JWT_SECRET` | `dev_secret` | Signing secret — change in production |
| `JWT_EXPIRES_IN` | `7d` | Token lifetime |
| `CLIENT_ORIGIN` | `*` | Allowed CORS origin |