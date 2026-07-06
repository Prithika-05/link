# CreatorHub Backend API

The backend server for the **CreatorHub** application. Built with **Fastify** for high performance, **Prisma** for type-safe database access, and **Redis** for caching and real-time pub/sub.

## 🛠 Tech Stack

- **Framework:** Fastify
- **ORM:** Prisma
- **Database:** PostgreSQL (Recommended)
- **Caching & Pub/Sub:** Redis
- **Real-time:** WebSockets (`ws`, `@fastify/websocket`)
- **Security:** `@fastify/helmet`, `@fastify/cors`, `@fastify/rate-limit`, `@fastify/jwt`, `bcrypt`
- **Logging:** Pino

---

## ⚙️ Environment Variables Setup

Proper configuration of your `.env` file is critical for the backend to connect to your database, Redis, and handle authentication securely.

### 1. Create the `.env` file
If it doesn't exist already, create a `.env` file in the root of the `backend` directory. *(Note: Prisma may have already created one with just the `DATABASE_URL`)*.

### 2. Add the following variables
Copy and paste the following configuration into your `.env` file and update the values to match your local environment.

```env
# ==========================================
# Server Configuration
# ==========================================
NODE_ENV=development
PORT=3000

# ==========================================
# Database Configuration (Prisma)
# ==========================================
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/creatorhub_db?schema=public"

# ==========================================
# Redis Configuration
# ==========================================
# Connection string for Redis (used by @fastify/redis)
REDIS_URL="redis://localhost:6379"

# ==========================================
# Authentication & Security (JWT & Bcrypt)
# ==========================================
# IMPORTANT: Use a long, random, and secure string in production!
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"

# Number of salt rounds for bcrypt password hashing
BCRYPT_SALT_ROUNDS=10

# ==========================================
# CORS Configuration
# ==========================================
# Comma-separated list of allowed frontend origins
CORS_ORIGIN="http://localhost:5173"
```

### 3. Variable Descriptions

| Variable | Description | Required |
| :--- | :--- | :---: |
| `NODE_ENV` | Application environment (`development`, `production`, `test`). 
| `PORT` | The port the Fastify server will listen on. Defaults to `3000`.
| `DATABASE_URL` | The connection string for your SQL database (used by Prisma).
| `REDIS_URL` | The connection string for your Redis instance.
| `JWT_SECRET` | Secret key used to sign and verify JSON Web Tokens.
| `JWT_EXPIRES_IN` | Expiration time for generated JWTs (e.g., `1h`, `7d`, `30d`).
| `BCRYPT_SALT_ROUNDS` | Computational cost for hashing passwords (default is 10).
| `CORS_ORIGIN` | Allowed frontend URL(s) for Cross-Origin Resource Sharing.

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Database
Ensure your PostgreSQL database is running and the `DATABASE_URL` in your `.env` is correct. Then, generate the Prisma Client:
```bash
npm install fastify
npm install prisma@7.8.0 @prisma/client@7.8.0
npx prisma init
npx prisma generate
```

### 3. Run the Development Server
Start the server with hot-reloading using Nodemon:
```bash
npm run dev
```
You should see the server running at `http://localhost:3000`.

---

## Project Structure

```text
backend/
├── prisma/
│   └── schema.prisma       # Database schema definition
├── src/
│   ├── config/             # App configuration (env, db, redis connections)
│   ├── plugins/            # Fastify plugins (cors, jwt, redis, helmet)
│   ├── middlewares/        # Custom middleware (auth checks, error handling)
│   ├── realtime/           # WebSocket handlers and socket logic
│   ├── utils/              # Helper functions and utilities
│   ├── modules/            # Feature-based business logic
│   │   ├── auth/           # Authentication (login, register, tokens)
│   │   ├── users/          # User profile management
│   │   ├── messages/       # Messaging and chat logic
│   │   └── keys/           # API key management
│   ├── app.js              # Fastify app instance setup
│   └── server.js           # Server entry point and startup logic
├── .env                    # Your local environment variables (DO NOT commit)
├── .env.example            # Template for environment variables
├── package.json
└── README.md
```

## Useful Scripts

- `npm run dev`: Starts the development server with Nodemon.
- `npm test`: Runs tests using Vitest.
- `npx prisma studio`: Opens Prisma Studio to view/edit database data visually in your browser.
```

### 2. Create `.env.example` (Best Practice)
It is highly recommended to create a `.env.example` file. This allows you to commit a "template" of your environment variables to Git so other developers (or you in the future) know what variables are required, **without exposing your actual passwords/secrets**.

Create a file named `.env.example` in the `backend` root and paste this:

```env
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DB_NAME?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth
JWT_SECRET="change-this-to-a-secure-random-string"
JWT_EXPIRES_IN="7d"
BCRYPT_SALT_ROUNDS=10

# CORS
CORS_ORIGIN="http://localhost:5173"
```