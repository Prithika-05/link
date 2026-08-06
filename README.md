# LinkChat - End-to-End Encrypted Messaging Platform

> A secure, real-time messaging platform implementing End-to-End Encryption (E2EE), JWT authentication, Redis caching, Socket.IO communication, Docker containerization, and Nginx reverse proxying.

**Live app:** https://linkchat.duckdns.org/

---

## Fixes

This section summarizes security vulnerabilities that were identified during assessment and subsequently remediated and validated in the LinkChat backend.

### Fix 1 - Application-Layer DoS Protection & Client IP Validation

| | |
|---|---|
| **Category** | Application-Layer Denial-of-Service (DoS) |
| **Severity** | High |
| **Status** | ✅ Remediated and Validated |
| **Infrastructure** | AWS Application Load Balancer → Nginx → Fastify → Redis → PostgreSQL |

**Issue:** Fastify's rate limiter was configured but not enforced globally (`global: false`), so only routes that explicitly opted in were protected. Operating behind an AWS ALB and Nginx also meant client identification depended on forwarded headers, which - without proxy trust configuration - could be spoofed or misread, weakening IP-based rate limiting and leaving endpoints like `/api/auth/login`, `/api/auth/register`, and `/api/messages` exposed to request flooding.

**Remediation - a layered, defense-in-depth architecture:**
- **Global Fastify rate limiting** - switched `global: false` → `global: true` so every endpoint is protected automatically.
- **Trusted proxy configuration** - `trustProxy: true` so Fastify resolves the real originating client IP instead of the proxy's address.
- **AWS ALB client IP restoration** - Nginx configured with `real_ip_header X-Forwarded-For`, `real_ip_recursive on`, and explicit `set_real_ip_from` trusted CIDR ranges.
- **Nginx edge rate limiting** - coarse-grained request throttling (`limit_req_zone`) filters large traffic floods before they ever reach the application layer.
- **Layered rate limiting** - Nginx blocks excessive traffic at the edge (Layer 1); Fastify enforces per-client, application-specific limits and returns HTTP 429 (Layer 2).

**Validation:** Rate limiting, client isolation, client IP accuracy, forwarding-header integrity, and normal application functionality were all tested post-remediation - all five test cases passed.

**Residual risk:** This remediation does not cover large volumetric network-layer attacks (better addressed by AWS Shield) or highly distributed attacks from many unique IPs (which may warrant a WAF or bot-mitigation layer).

### Fix 2 - Information Disclosure: User Search & Global Presence

| | |
|---|---|
| **Project** | LinkChat Application Backend |
| **Category** | Information Disclosure / Broken Access Control |
| **Status** | ✅ Remediated with regression tests |

Two related vulnerabilities allowed authenticated users to access information beyond their intended authorization boundary.

**Vulnerability 1 - User Search Information Disclosure**
*Affected file: `backend/src/modules/users/users.service.js`*

`searchUsers()` allowed lookups by both username **and email**, and returned `email`, `avatarUrl`, and `status` in the response - enabling any authenticated user to enumerate accounts by email and harvest private profile data.

- **Before:** searched `username` OR `email`; returned `publicId, username, displayName, email, avatarUrl, status`
- **After:** searches `username` only; returns `publicId, username, displayName` only

**Vulnerability 2 - Global Presence Information Disclosure**
*Affected file: `backend/src/realtime/gateways/presence.gateway.js`*

Presence events (`USER_ONLINE` / `USER_OFFLINE`) were broadcast to **every** connected client via `io.emit(...)`, letting any authenticated user monitor everyone's login/logout activity, and the payload leaked the internal database `userId` alongside the public identifier.

- **Before:** `io.emit(EVENTS.USER_ONLINE, { userId, publicId })` broadcast globally
- **After:** a new `notifyContacts()` helper resolves the user's **accepted contacts only**, looks up their active sockets, and sends the event solely to those authorized recipients - with a payload trimmed to `{ publicId }`, removing the internal `userId` entirely. Existing `connectionManager` APIs (keyed by `publicId`) required no changes, preserving compatibility.

**Outcome:** Both fixes were minimal, targeted changes that eliminate unnecessary exposure of personal data and presence activity, enforce the principle of least privilege, and ship with regression tests to prevent reintroduction (email search is blocked, private fields are never returned, presence events are never broadcast globally, and internal IDs never leave the server).

---

## Table of Contents

0. [Fixes](#fixes)
1. [Executive Summary](#1-executive-summary)
2. [Project Overview](#2-project-overview)
3. [Feature Set](#3-feature-set)
4. [Technology Stack](#4-technology-stack)
5. [System Architecture](#5-system-architecture)
6. [Frontend Architecture](#6-frontend-architecture)
7. [Backend Architecture](#7-backend-architecture)
8. [API Surface](#8-api-surface)
9. [Database Design](#9-database-design)
10. [Authentication & Session Security](#10-authentication--session-security)
11. [End-to-End Encryption Design](#11-end-to-end-encryption-design)
12. [Real-Time Communication](#12-real-time-communication)
13. [Redis Usage](#13-redis-usage)
14. [Security Architecture](#14-security-architecture)
15. [Deployment Architecture](#15-deployment-architecture)
16. [Testing & Code Quality](#16-testing--code-quality)
17. [Repository Structure](#17-repository-structure)
18. [Getting Started](#18-getting-started)
19. [Recommendations & Future Enhancements](#19-recommendations--future-enhancements)
20. [Conclusion](#20-conclusion)

---

## 1. Executive Summary

LinkChat is a privacy-first, real-time messaging application engineered to deliver confidential, authenticated, and low-latency communication between users. Unlike conventional chat systems that store readable message content on the server, LinkChat performs all encryption and decryption operations exclusively on the client device. The backend infrastructure - built on Fastify, PostgreSQL, and Redis - stores and relays only ciphertext, meaning that at no point does the server, its operators, or a database compromise expose the plaintext content of a conversation.

The system combines a modern React single-page application with a Node.js/Fastify API layer, a Socket.IO real-time transport, and a PostgreSQL persistence layer accessed through the Drizzle ORM. Security is addressed holistically: bcrypt-hashed credentials, short-lived JWT access tokens paired with rotating refresh tokens, device-session tracking, Redis-backed replay protection, and a full end-to-end encryption pipeline built on Elliptic-Curve Diffie–Hellman (ECDH) key exchange, HKDF key derivation, and AES-GCM authenticated encryption.

The application is containerized with Docker and Docker Compose and deployed to a production environment on Amazon Web Services (AWS EC2), fronted by an Nginx reverse proxy that terminates HTTPS and forwards both REST and WebSocket traffic. A DuckDNS-managed domain, bound to a static AWS Elastic IP, provides a persistent, human-readable address for the service.

---

## 2. Project Overview

LinkChat is a full-stack messaging platform designed around a single guiding principle: **the server should never be able to read a user's messages.** This is achieved through client-side end-to-end encryption (E2EE), where cryptographic operations happen entirely in the browser using the native Web Crypto API. The backend's role is reduced to authentication, key distribution, message routing, and encrypted-payload storage.

### 2.1 Problem Statement

Conventional messaging systems typically decrypt or process message content on the server, creating a single point of exposure in the event of a data breach, insider threat, or compelled disclosure. LinkChat addresses this by ensuring that plaintext content never leaves the sender's device and is only ever reconstructed on the recipient's device.

### 2.2 Core Objectives

- Secure, verifiable user authentication with strong password hashing
- End-to-end encryption for every message exchanged between users
- Prevention of replay attacks and other message-tampering vectors
- Real-time message and presence delivery with minimal latency
- Persistence of only encrypted payloads in the database - never plaintext
- Horizontally scalable, containerized deployment
- A clean, modular, testable codebase across frontend and backend

---

## 3. Feature Set

### 3.1 Account & Session Management
- User registration with username, display name, email, and password
- Secure login with bcrypt-verified credentials
- JWT access tokens combined with rotating, revocable refresh tokens
- Multi-device session tracking (device name, platform, browser, IP address, last-seen time)
- Per-session and bulk ("log out everywhere") session revocation
- Profile management and password change with re-authentication

### 3.2 Contacts & Social Graph
- User search by username
- Contact requests with Pending / Accepted / Rejected lifecycle
- Accepted-contacts and verified-contacts (fingerprint-confirmed) listings
- Contact removal

### 3.3 Messaging
- Real-time, end-to-end encrypted text messaging
- Per-conversation message history retrieval with pagination
- Delivery receipts and read receipts (Sent → Delivered → Read lifecycle)
- Typing indicators and online / offline / away presence
- Message type support for text, image, file, and system messages at the schema level

### 3.4 Cryptographic Key Management
- Client-generated ECDH key pairs; private keys never leave the device unencrypted
- Public key + fingerprint registration and lookup for contact verification
- Encrypted private-key backup and restore, protected by a user-supplied passphrase

### 3.5 Platform & Operations
- Dockerized deployment of every service (frontend, backend, database, cache, proxy)
- Nginx reverse proxy with HTTPS termination and WebSocket upgrade support
- Centralized structured logging (Pino) and security/audit event logging
- Rate limiting on every sensitive endpoint to mitigate abuse and brute-force attacks

---

## 4. Technology Stack

| Layer / Concern | Technology |
|---|---|
| Frontend Framework | React 19 (Vite build tooling) |
| Client State Management | Redux Toolkit / React-Redux |
| Client Routing | React Router v7 |
| Client-side Cryptography | Web Crypto API, hash-wasm |
| Client HTTP Layer | Axios |
| Client Realtime | Socket.IO Client |
| Styling | Tailwind CSS |
| Backend Framework | Fastify 5 (Node.js, ES Modules) |
| ORM / Query Builder | Drizzle ORM |
| Primary Database | PostgreSQL |
| Cache / Pub-Sub | Redis (node-redis, `@fastify/redis`) |
| Real-time Transport | Socket.IO + `@socket.io/redis-adapter` |
| Authentication | `@fastify/jwt`, `jsonwebtoken` |
| Password Hashing | bcrypt |
| Security Middleware | `@fastify/helmet`, `@fastify/cors`, `@fastify/rate-limit` |
| Logging | Pino / pino-pretty |
| Identifiers | `@paralleldrive/cuid2` |
| Reverse Proxy | Nginx |
| Containerization | Docker & Docker Compose |
| Cloud Hosting | Amazon Web Services (EC2) with Elastic IP |
| Dynamic DNS | DuckDNS |
| Testing | Vitest (backend unit & security tests) |

---

## 5. System Architecture

LinkChat follows a layered client-server architecture. The browser communicates exclusively with Nginx over HTTPS; Nginx forwards REST calls and WebSocket upgrades to the Fastify API, which in turn coordinates with PostgreSQL for durable storage and Redis for caching, presence, and pub/sub messaging across API instances.

```text
                         Browser (React SPA)
                                 │
                          HTTPS / WSS
                                 │
                                 ▼
                              Nginx
                      (Reverse Proxy, TLS)
                                 │
                                 ▼
                          Fastify API Server
                                 │
             ┌───────────────────┼────────────────────┐
             ▼                   ▼                     ▼
      Authentication         Socket.IO             Business Logic
        Module                Gateway            (Contacts / Messages /
                                                   Users / Keys)
             │                   │                     │
             └─────────┬─────────┴──────────┬──────────┘
                        ▼                    ▼
                  PostgreSQL              Redis
              (Drizzle ORM / Data)   (Presence, Replay
                                     Protection, Pub/Sub)
```

### 5.1 Architectural Principles

- **Separation of concerns** - authentication, real-time transport, and domain logic live in independent modules under `backend/src/modules`.
- **Statelessness at the API layer** - JWT-based authentication allows any API instance to serve any request; session state that must be shared (presence, socket rooms) lives in Redis.
- **Zero-knowledge server** - the backend is architected so it only ever handles ciphertext, IVs, authentication tags, and ephemeral public keys - never plaintext or private keys.
- **Defence in depth** - transport security (HTTPS/WSS), application security (JWT, rate limiting, input validation schemas), and data security (encryption, hashing) are layered independently.

---

## 6. Frontend Architecture

The frontend is a single-page application built with React 19 and Vite, structured around feature-oriented directories for pages, services, state slices, and routing guards.

```text
frontend/src/
├── api/            → httpClient (Axios instance), API error mapping
├── components/      → common/, chat/, contacts/ UI components
├── config/          → environment.js, navigation.js
├── constants/       → realtimeEvents.js, storage.js
├── layouts/         → AppLayout, AuthLayout
├── pages/           → Landing, Login, Register, Dashboard, Contacts,
│                       Profile, Settings, KeySetup, NotFound
├── providers/        → RealtimeProvider (Socket.IO context)
├── routes/           → ProtectedRoute, PublicOnlyRoute, KeyProtectedRoute
├── services/         → auth, crypto, key, message, user, socket,
│                       contactStorage, messageStorage, settingsStorage,
│                       tokenStorage, healthService
├── state/            → Redux store + feature slices (auth, contacts,
│                       messages, settings, system)
└── utils/            → formatters, contact helpers
```

### 6.1 State Management
Global state is managed with Redux Toolkit, split into five feature slices - authentication, contacts, messages, settings, and system status - each with its own reducer and selectors, composed in a single store.

### 6.2 Route Protection
Three route guard components enforce access control at the routing layer: `ProtectedRoute` restricts pages to authenticated users, `PublicOnlyRoute` prevents authenticated users from re-visiting login/registration screens, and `KeyProtectedRoute` ensures a user cannot access messaging features until their encryption key pair has been generated or restored.

### 6.3 Client-side Services
- **cryptoService** - wraps the Web Crypto API for ECDH key generation, HKDF derivation, and AES-GCM encrypt/decrypt
- **keyService** - manages upload, retrieval, and encrypted backup/restore of key material
- **authService / tokenStorage** - handles login, registration, logout, and secure storage of access and refresh tokens
- **socketService / RealtimeProvider** - establishes and maintains the authenticated Socket.IO connection and exposes real-time events to components
- **messageService / messageStorage** - sends and retrieves messages and manages local message caching

---

## 7. Backend Architecture

The backend is a Fastify application organized by domain module, each exposing its own routes, controller, service, and validation schema.

```text
backend/src/
├── app.js                 → Fastify app assembly (plugins, routes)
├── server.js               → Process entry point
├── config/env.js           → Centralized environment configuration
├── plugins/                 → cors, helmet, jwt, redis, drizzle,
│                              rate-limit, logger (Fastify plugins)
├── middlewares/             → auth.middleware, security.middleware,
│                              logger.middleware
├── modules/
│   ├── auth/                → register, login, refresh, logout, sessions
│   ├── users/                → profile, search, password change
│   ├── contacts/             → requests, accept/reject, listing
│   ├── messages/              → send, conversation history, receipts
│   ├── keys/                  → public key + encrypted backup management
│   ├── security/              → security event logging
│   └── audit/                 → audit trail logging
├── realtime/
│   ├── socket.js               → Socket.IO server bootstrap
│   ├── auth.js                  → Socket authentication (JWT handshake)
│   ├── connection.manager.js    → Tracks active socket connections
│   ├── room.manager.js          → Per-user private room management
│   ├── presence.js              → Online/offline/away tracking (Redis)
│   ├── redis.adapter.js         → Socket.IO Redis adapter (multi-instance)
│   ├── socket.rate-limit.js     → Per-socket event rate limiting
│   └── gateways/                → message, presence, receipt, typing
├── db/
│   ├── schema.js                 → Drizzle ORM table & relation definitions
│   ├── migrate.js                → Migration runner
│   └── seed.js                    → Development data seeding
├── utils/                          → crypto, password, pagination,
│                                     response, constants
└── error.js                        → Centralized error handling
```

### 7.1 Application Bootstrap
`server.js` starts the Node.js process and delegates to `app.js`, which registers Fastify plugins (CORS, Helmet, JWT, Redis, Drizzle, rate limiting, logging) before mounting the domain route modules. This plugin-first design means cross-cutting concerns - security headers, request logging, database connectivity - are configured once and made available to every route via Fastify's dependency-injection style decorators.

### 7.2 Middleware Layer
- **auth.middleware.js** - verifies the JWT bearer token on protected routes and attaches the authenticated user's identity to the request
- **security.middleware.js** - applies additional security checks and header enforcement
- **logger.middleware.js** - structured request/response logging via Pino, correlating each request with an ID

---

## 8. API Surface

All REST endpoints are namespaced by module and validated using per-route JSON schemas. Every mutating or sensitive endpoint is protected by Fastify's rate-limit plugin, with limits tuned to the sensitivity of the operation.

### 8.1 Authentication Endpoints (`/auth`)

| Method | Endpoint | Auth | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/auth/register` | No | 3 / hour | Create a new user account |
| POST | `/auth/login` | No | 5 / 15 min | Authenticate and issue access + refresh tokens |
| POST | `/auth/refresh` | No | 20 / hour | Exchange a valid refresh token for a new access token |
| POST | `/auth/logout` | Yes | 20 / hour | Revoke the current session's refresh token |
| GET | `/auth/sessions` | Yes | - | List all active device sessions for the user |
| DELETE | `/auth/sessions/:sessionId` | Yes | - | Revoke a specific device session |
| DELETE | `/auth/sessions` | Yes | - | Revoke all active sessions ("log out everywhere") |

### 8.2 User Endpoints (`/users`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/users/me` | Yes | Retrieve the current authenticated user's profile |
| GET | `/users/search` | Yes | Search for users (used for adding contacts) |
| GET | `/users/username/:username` | Yes | Look up a user by username |
| GET | `/users/:publicId` | Yes | Look up a user by their public ID |
| PATCH | `/users/me` | Yes | Update the current user's profile (10/hour) |
| PATCH | `/users/change-password` | Yes | Change the account password (5/hour) |

### 8.3 Contact Endpoints (`/contacts`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/contacts/requests` | Yes | Send a contact request to another user |
| POST | `/contacts/requests/respond` | Yes | Accept or reject a pending contact request |
| GET | `/contacts/requests/pending` | Yes | List incoming pending contact requests |
| DELETE | `/contacts/:targetPublicId` | Yes | Remove an existing contact |
| GET | `/contacts/accepted` | Yes | List all accepted contacts |
| GET | `/contacts/verified` | Yes | List contacts whose key fingerprint has been verified |

### 8.4 Messaging Endpoints (`/messages`)

| Method | Endpoint | Auth | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/messages` | Yes | 120 / min | Send an encrypted message (ciphertext, IV, auth tag, ephemeral public key) |
| GET | `/messages/:publicId` | Yes | 300 / min | Retrieve conversation history with a given contact |
| PATCH | `/messages/:messageId/delivered` | Yes | 120 / min | Mark a message as delivered |
| PATCH | `/messages/:messageId/read` | Yes | 120 / min | Mark a message as read |

### 8.5 Key Management Endpoints (`/keys`)

| Method | Endpoint | Auth | Rate Limit | Description |
|---|---|---|---|---|
| POST | `/keys` | Yes | 20 / min | Upload the user's public key and fingerprint |
| GET | `/keys/me` | Yes | 60 / min | List the current user's registered public keys |
| DELETE | `/keys/me` | Yes | 10 / min | Delete the current user's public key |
| POST | `/keys/backup` | Yes | 10 / min | Upload an encrypted private-key backup |
| GET | `/keys/backup/me` | Yes | 30 / min | Retrieve the current user's encrypted key backup |
| GET | `/keys/:publicId` | Yes | 60 / min | Retrieve another user's public key by public ID |

---

## 9. Database Design

Persistence is implemented in PostgreSQL and modeled with Drizzle ORM, which provides type-safe schema definitions, migrations, and relational query building. The schema defines ten core tables plus four PostgreSQL enum types, all connected through foreign-key relations with cascading deletes.

### 9.1 Enumerated Types
- `UserStatus` - ONLINE, OFFLINE, AWAY
- `MessageStatus` - SENT, DELIVERED, READ, FAILED
- `MessageType` - TEXT, IMAGE, FILE, SYSTEM
- `ContactRequestStatus` - PENDING, ACCEPTED, REJECTED

### 9.2 Core Tables

| Table | Purpose | Key Fields |
|---|---|---|
| `User` | Core account record | id, publicId, username, displayName, email, passwordHash, avatarUrl, status, createdAt, updatedAt |
| `PublicKey` | Registered E2EE public keys | id, userId (FK), algorithm, key, fingerprint (unique), createdAt, updatedAt |
| `Message` | Encrypted message payloads | id, senderId (FK), receiverId (FK), ciphertext, iv, authTag, ephemeralPublicKey, status, type, deliveredAt, readAt, createdAt, updatedAt |
| `RefreshToken` | Rotating refresh tokens | id, tokenId (unique), userId (FK), parentId (self-FK, lineage), expiresAt, revoked, createdAt |
| `keyBackups` | Encrypted private-key backups | id, userId (FK), encryptedPrivateKey, salt, iv, fingerprint, createdAt, updatedAt |
| `DeviceSession` | Active device/session metadata | id, userId (FK), refreshTokenId (FK, unique), deviceName, platform, browser, ipAddress, userAgent, lastSeenAt, createdAt |
| `RevokedToken` | Denylist of revoked JWT IDs | id, tokenId (unique), expiresAt, createdAt |
| `AuditLog` | General audit trail | id, userId (FK), action, ipAddress, userAgent, createdAt |
| `SecurityEvent` | Security-relevant events | id, userId (FK, nullable), event, severity, ipAddress, userAgent, metadata (JSON), createdAt |
| `ContactRequest` | Contact request lifecycle | id, senderId (FK), receiverId (FK), status, createdAt, updatedAt |

### 9.3 Indexing Strategy
Query-critical columns are indexed to keep conversation retrieval and lookups performant at scale: sender/receiver/timestamp composite indexes on `Message` support fast conversation-thread queries; `userId` indexes on `PublicKey`, `RefreshToken`, `DeviceSession`, `AuditLog`, and `SecurityEvent` support fast per-user lookups; and a unique composite index on `ContactRequest` prevents duplicate pending requests between the same pair of users.

### 9.4 Referential Integrity
All foreign keys reference the `User` table with `ON DELETE CASCADE`, ensuring that removing a user account automatically and consistently removes their keys, sessions, messages, contact requests, and audit/security records - avoiding orphaned data.

---

## 10. Authentication & Session Security

### 10.1 Registration Flow
1. The user submits username, display name, email, and password.
2. The backend validates all inputs against a JSON schema.
3. The password is hashed with bcrypt before storage - plaintext passwords are never persisted.
4. A new user record is written to PostgreSQL.
5. The browser generates an ECDH key pair locally.
6. The public key and its fingerprint are uploaded to the server; the private key remains on the client.

### 10.2 Login Flow
1. The user submits email and password.
2. The backend retrieves the corresponding user record.
3. `bcrypt.compare()` verifies the submitted password against the stored hash.
4. On success, the server issues a short-lived JWT access token and a long-lived refresh token.
5. The refresh token is persisted (with an expiry and revocation flag) and associated with a new device-session record.

### 10.3 Access Tokens vs. Refresh Tokens

| Aspect | Access Token (JWT) | Refresh Token |
|---|---|---|
| Lifetime | Short-lived | Long-lived |
| Purpose | Authorizes every protected API/socket request | Used only to obtain a new access token |
| Storage | Held in memory / short-term client storage | Stored with device-session metadata; revocable |
| Revocation | Denylisted via `RevokedToken` on logout | Marked revoked in `RefreshToken` table |
| Lineage | N/A | Tracks a `parentId` for rotation lineage / reuse detection |

### 10.4 Request Authorization
Every protected REST call must include an `Authorization: Bearer <token>` header. The auth middleware verifies the JWT signature and expiry, extracts the user's identity, and checks the token against the revocation list before allowing the request to proceed. The same JWT is used to authenticate the Socket.IO handshake for the real-time channel.

### 10.5 Device Session Management
Each login creates a `DeviceSession` record capturing device name, platform, browser, IP address, user agent, and last-seen timestamp, linked one-to-one with its refresh token. Users can view all devices currently signed into their account and revoke access to a single device or to every device at once.

### 10.6 Logout
- The active refresh token is revoked
- The JWT is added to the revocation list for the remainder of its natural lifetime
- The Socket.IO connection is terminated
- Redis presence state is updated to reflect the user as offline

---

## 11. End-to-End Encryption Design

The confidentiality guarantee at the heart of LinkChat rests on a client-side cryptographic pipeline that combines Elliptic-Curve Diffie–Hellman (ECDH) key agreement, HKDF key derivation, and AES-GCM authenticated symmetric encryption - all executed through the browser's native Web Crypto API. The server is architecturally incapable of decrypting message content because it never possesses the private keys or the derived symmetric keys.

### 11.1 Encryption Pipeline

```text
Plaintext Message
       │
       ▼
Generate Ephemeral ECDH Key Pair  (per message)
       │
       ▼
ECDH(ephemeralPrivateKey, recipientPublicKey) → Shared Secret
       │
       ▼
HKDF(sharedSecret) → AES-GCM Symmetric Key
       │
       ▼
AES-GCM Encrypt(plaintext, key, iv) → Ciphertext + Auth Tag
       │
       ▼
Transmit: { ciphertext, iv, authTag, ephemeralPublicKey }
```

### 11.2 What the Server Stores
- **Ciphertext** - the AES-GCM encrypted message body
- **IV (Initialization Vector)** - unique per message
- **Authentication Tag** - proves integrity and authenticity of the ciphertext
- **Ephemeral Public Key** - the sender's one-time public key for this message

The database never contains plaintext content, the sender's or recipient's long-term private key, or the derived AES key.

### 11.3 Decryption Flow (Recipient)
1. The recipient's client downloads the encrypted message envelope.
2. It performs ECDH using its own long-term private key and the sender's ephemeral public key.
3. HKDF derives the identical AES-GCM key that the sender computed.
4. AES-GCM decrypts the ciphertext locally, verifying the authentication tag before returning plaintext.

### 11.4 Security Properties
- **Confidentiality** - only holders of the relevant private keys can derive the symmetric key needed to decrypt a message
- **Integrity & Authenticity** - AES-GCM's authentication tag detects any tampering with the ciphertext in transit or at rest
- **Forward Secrecy** - a fresh ephemeral key pair is generated per message, so compromise of one message's ephemeral key does not expose past or future messages
- **Key Custody** - long-term private keys are generated and remain on the client; an optional encrypted backup (protected by a user passphrase, salt, and IV) allows recovery without exposing the raw key to the server

---

## 12. Real-Time Communication

Real-time features - message delivery, presence, typing indicators, and read receipts - are implemented with Socket.IO, layered on top of the same JWT authentication used for REST calls, and coordinated across multiple backend instances using the Socket.IO Redis adapter.

### 12.1 Connection Lifecycle
1. After a successful login, the browser opens a Socket.IO connection carrying the JWT.
2. The `realtime/auth.js` handshake handler verifies the token before allowing the connection.
3. The connection manager registers the socket, and the room manager places the user into a private, user-scoped room.
4. Redis is updated to mark the user's presence as online.

### 12.2 Realtime Gateways

| Gateway | Responsibility |
|---|---|
| `message.gateway.js` | Broadcasts newly sent encrypted messages to the recipient's room in real time |
| `presence.gateway.js` | Publishes online / offline / away status changes |
| `receipt.gateway.js` | Emits delivery and read receipt events |
| `typing.gateway.js` | Emits typing-start / typing-stop indicators between contacts |

### 12.3 Multi-Instance Scalability
Because Socket.IO connections are stateful and pinned to a single server process, the Redis adapter (`@socket.io/redis-adapter`) is used to broadcast events across all running backend instances. This allows two users connected to different API containers behind Nginx to still exchange real-time events seamlessly, and is a prerequisite for horizontal scaling.

### 12.4 Abuse Protection
A dedicated `socket.rate-limit.js` module throttles per-socket event rates, preventing a compromised or malicious client from flooding the realtime layer with excessive events.

---

## 13. Redis Usage

Redis serves as the application's fast, in-memory coordination layer, supporting several distinct responsibilities beyond simple caching:

- **Online Presence** - tracks which users are currently connected and their status (online/offline/away)
- **Replay-Attack Protection** - records recently seen message identifiers/nonces so that a captured and re-sent request cannot be processed twice
- **Socket.IO Pub/Sub** - the adapter layer that lets multiple backend instances share real-time events
- **Rate Limiting Store** - backs the `@fastify/rate-limit` plugin so limits are enforced consistently across instances
- **General-purpose caching** - reduces repeated load on PostgreSQL for frequently accessed, low-volatility data

---

## 14. Security Architecture

| Control | Implementation |
|---|---|
| Password Storage | bcrypt hashing - never stored or logged in plaintext |
| Transport Security | HTTPS/TLS termination at Nginx; internal Docker traffic isolated from the public internet |
| Authentication | JWT access tokens with signature and expiry verification on every protected request |
| Session Control | Rotating refresh tokens, revocation lists, and per-device session management |
| Message Confidentiality | Client-side ECDH + HKDF + AES-GCM end-to-end encryption |
| Message Integrity | AES-GCM authentication tags detect tampering |
| Forward Secrecy | Per-message ephemeral ECDH key pairs |
| Replay Protection | Redis-backed nonce/identifier tracking |
| Injection Protection | Parameterized queries via Drizzle ORM (no raw string-concatenated SQL) |
| Rate Limiting | Per-route limits (e.g. 3/hour on registration, 5/15min on login) via `@fastify/rate-limit` |
| Security Headers | `@fastify/helmet` applies standard HTTP security headers |
| CORS Policy | `@fastify/cors` restricts allowed origins |
| Audit Trail | Dedicated `AuditLog` and `SecurityEvent` tables capture user actions and security-relevant events |
| Input Validation | Per-route JSON schema validation on every request body/query/params |

### 14.1 Automated Security Testing
The backend includes a dedicated security test suite (`backend/tests/security`) built on Vitest, covering authorization boundaries, presence-gateway access control, and user profile/search endpoint security - verifying that users cannot access or enumerate data outside their authorized scope.

---

## 15. Deployment Architecture

LinkChat is deployed to a production environment on Amazon Web Services, using an EC2 instance running Ubuntu Linux as the host for a fully Dockerized service topology, fronted by Nginx and addressed through a DuckDNS domain bound to a static Elastic IP.

### 15.1 Deployment Topology

```text
                         Internet
                             │
                             ▼
                https://linkchat.duckdns.org
                             │
                        DuckDNS DNS
                             │
                             ▼
                     AWS Elastic IP
                             │
                             ▼
                  AWS EC2 Instance (Ubuntu)
                             │
                      Docker Compose
                             │
        ┌────────────────────┼────────────────────┐
        ▼                    ▼                     ▼
      Nginx             Fastify API              Redis
                              │
                              ▼
                         PostgreSQL
```

### 15.2 Why an Elastic IP
A standard EC2 public IP address changes whenever the instance is stopped and restarted, which would break the DNS mapping. Associating an AWS Elastic IP with the instance guarantees a fixed public address across restarts, so the DuckDNS domain always resolves to the correct server.

### 15.3 DuckDNS Domain Mapping
A DuckDNS subdomain is mapped to the Elastic IP, giving the application a stable, human-readable address (`https://linkchat.duckdns.org/`) without the cost of a commercial domain registration.

### 15.4 Docker Compose Orchestration
A single `docker-compose.yml` defines and orchestrates five services - frontend, backend, PostgreSQL, Redis, and Nginx - inside an isolated internal Docker network. Services address one another by container name (for example, the backend connects to `postgres:5432` rather than a raw IP).

```bash
docker compose up -d
```

- Builds images, creates the network, and starts every service in the correct dependency order
- Failed containers are automatically restarted per the defined restart policy
- Only Nginx is exposed publicly; the backend, database, and cache remain reachable solely within the internal Docker network

### 15.5 Nginx Reverse Proxy
Nginx is the sole public entry point for the application. It terminates HTTPS, serves the built frontend as static assets, proxies REST API calls to the Fastify backend, and upgrades and forwards WebSocket connections for Socket.IO - while also providing gzip/br compression, rate limiting, and request filtering.

### 15.6 Environment Configuration
Sensitive configuration (database credentials, JWT secret, Redis connection string, DuckDNS token, environment mode, and port) is supplied via environment variables and a `.env` file that is excluded from version control, with a `scripts/generate-env.sh` helper and `.env.example` templates provided for repeatable environment setup.

### 15.7 End-to-End Production Request Flow

```text
User → https://linkchat.duckdns.org → DuckDNS → Elastic IP → AWS EC2
     → Nginx → Fastify → JWT Authentication → Redis → PostgreSQL
     → Response → Browser

Message send:
Sender encrypts in browser → HTTPS → DuckDNS → Elastic IP → Nginx
  → Fastify → Redis replay check → PostgreSQL stores ciphertext
  → Socket.IO notifies recipient → Recipient downloads ciphertext
  → Recipient decrypts locally in browser
```

---

## 16. Testing & Code Quality

- **Vitest** is used as the backend test runner, including a dedicated `tests/security` suite covering authorization, presence-gateway access, and profile/search endpoint security
- Standalone diagnostic scripts (`test-rate-limit.js`, `test-rate-limit-validation.js`, `test-x-forwarded-for.js`) validate rate-limiting behavior and correct client-IP resolution behind the reverse proxy
- **ESLint** and **Prettier** are configured on both frontend and backend to enforce consistent code style
- Per-route JSON schema validation acts as a first line of defense against malformed or malicious input at the API boundary

---

## 17. Repository Structure

```text
link/
├── frontend/          → React SPA (Vite, Redux Toolkit, Tailwind CSS)
├── backend/            → Fastify API, Socket.IO, Drizzle ORM
│   ├── src/
│   ├── drizzle/         → Generated SQL migrations & metadata
│   └── tests/            → Vitest unit & security tests
├── nginx/                → nginx.conf reverse-proxy configuration
├── scripts/               → generate-env.sh environment helper
├── docker-compose.yml       → Multi-service orchestration definition
└── README.md                  → Project documentation
```

---

## 18. Getting Started

### 18.1 Prerequisites
- Node.js (LTS) and pnpm
- PostgreSQL and Redis (or use the provided Docker Compose setup)
- Docker & Docker Compose (recommended for full-stack local runs)

### 18.2 Environment Setup
Copy `backend/.env.example` to `backend/.env` and configure:

```env
DATABASE_URL=postgres://username:password@localhost:5432/LinkChat
JWT_SECRET=your_secret_key
REDIS_URL=redis://localhost:6379
NODE_ENV=development
PORT=3000
```

### 18.3 Backend

```bash
cd backend
npm install
npm run db:migrate
npm run dev
```

### 18.4 Frontend

```bash
cd frontend
npm install
npm run dev
```

### 18.5 Full Stack via Docker Compose

```bash
docker compose up -d 
```

This starts the frontend, backend, PostgreSQL, Redis, and Nginx as a single orchestrated stack.

---

## 19. Recommendations & Future Enhancements

- Group / multi-party E2EE conversations using a sender-key or double-ratchet-style protocol
- Media (image/file) end-to-end encryption with client-side chunked upload and streaming decryption
- Formal adoption of a double-ratchet algorithm (as used by Signal) to further strengthen forward and post-compromise secrecy on a per-conversation basis
- Push notifications for offline recipients via a service worker, without exposing message content to the notification payload
- Horizontal auto-scaling of the backend behind a load balancer, building on the existing Redis-adapter-based multi-instance support
- Migration from a DuckDNS free subdomain to a registered custom domain with automated TLS certificate renewal (e.g., Let's Encrypt / Certbot)
- Formal third-party penetration testing and cryptographic implementation review prior to a broader public launch

---

## 20. Conclusion

LinkChat demonstrates a coherent, modern architecture for secure real-time messaging, combining JWT-based authentication with rotating refresh tokens, PostgreSQL persistence via Drizzle ORM, Redis-backed presence and replay protection, Socket.IO real-time transport, and containerized deployment behind an Nginx reverse proxy on AWS. Its defining characteristic is a genuine, browser-native end-to-end encryption pipeline - ECDH key exchange, HKDF key derivation, and AES-GCM authenticated encryption - that ensures message confidentiality, integrity, and forward secrecy while the server itself never has access to plaintext content or private key material.