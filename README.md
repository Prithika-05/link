
# LinkMe – End-to-End Encrypted Messaging Application

> A secure, real-time messaging platform implementing End-to-End Encryption (E2EE), JWT authentication, Redis caching, Socket.IO communication, Docker containerization, and Nginx reverse proxying.

---

# Table of Contents

1. Project Overview
2. Objectives
3. Features
4. Technology Stack
5. System Architecture
6. Complete Application Workflow
7. Authentication (JWT & Refresh Tokens)
8. End-to-End Encryption
9. Redis
10. Nginx
11. Docker & Deployment
12. Database Design
13. Folder Structure
14. Security Features
15. Future Enhancements
16. Conclusion

---

# 1. Project Overview

LinkMe is a privacy-focused messaging application designed to provide secure real-time communication between users.

Unlike conventional messaging systems, LinkMe encrypts messages on the client before transmission. The backend only stores encrypted data and never has access to plaintext.

Core objectives:
- Secure authentication
- End-to-End Encryption
- Real-time communication
- Scalability
- Modern deployment with Docker

---

# 2. Objectives

- Secure user authentication
- Protect passwords using bcrypt
- Encrypt every message
- Prevent replay attacks
- Deliver messages in real time
- Store only encrypted payloads
- Support scalable deployment

---

# 3. Features

- User registration & login
- JWT authentication
- Refresh token authentication
- Contact management
- Real-time messaging
- Online/offline presence
- Read receipts
- End-to-End Encryption
- Redis caching & Pub/Sub
- Docker deployment
- Nginx reverse proxy

---

# 4. Technology Stack

| Layer | Technology |
|------|------------|
| Frontend | React + Web Crypto API |
| Backend | Fastify (Node.js) |
| Database | PostgreSQL |
| Cache | Redis |
| Real-Time | Socket.IO |
| ORM | Drizzle ORM |
| Authentication | JWT |
| Password Security | bcrypt |
| Encryption | ECDH + HKDF + AES-GCM |
| Reverse Proxy | Nginx |
| Deployment | Docker & Docker Compose |

---

# 5. System Architecture

```text
                Browser
                   │
               HTTPS
                   │
                   ▼
                Nginx
                   │
         Reverse Proxy
                   │
                   ▼
             Fastify API
                   │
      ┌────────────┼─────────────┐
      ▼            ▼             ▼
 Authentication Socket.IO Business Logic
      │            │
      └──────┬─────┘
             ▼
      ┌──────────────┐
      ▼              ▼
   PostgreSQL      Redis
```

---

# 6. Complete Workflow

## Registration

1. User enters username, email and password.
2. Backend validates inputs.
3. Password is hashed using bcrypt.
4. User record is saved in PostgreSQL.
5. Browser generates an ECDH public/private key pair.
6. Public key and fingerprint are uploaded.
7. Private key remains on the client device.

## Login

1. User submits email and password.
2. Backend retrieves user record.
3. bcrypt.compare() verifies password.
4. Backend creates:
   - Access Token (JWT)
   - Refresh Token
5. JWT is returned to the browser.
6. Refresh token is stored securely.

## Authentication

Each protected request sends:

Authorization: Bearer <JWT>

Backend:
- verifies JWT signature
- checks expiry
- extracts user id
- authorizes the request

## WebSocket Connection

After login:

- Browser opens Socket.IO connection.
- JWT authenticates the socket.
- User joins a private room.
- Redis marks user as online.

## Contact Request

1. User searches another user.
2. Sends contact request.
3. Backend validates request.
4. PostgreSQL stores pending request.
5. Socket.IO notifies recipient.
6. Recipient accepts.
7. Status becomes ACCEPTED.

## Secure Messaging

Sender:

1. Generates an Ephemeral Key Pair.
2. Uses ECDH with recipient public key.
3. HKDF derives AES key.
4. AES-GCM encrypts plaintext.
5. Sends:
   - Ciphertext
   - IV
   - Authentication Tag
   - Ephemeral Public Key

Backend:

- Verifies JWT.
- Checks replay protection with Redis.
- Stores encrypted payload only.
- Uses Socket.IO to notify recipient.

Recipient:

1. Downloads encrypted message.
2. Uses private key + sender ephemeral public key.
3. ECDH derives identical shared secret.
4. HKDF derives identical AES key.
5. AES-GCM decrypts locally.

## Logout

- Refresh token revoked.
- JWT discarded.
- Socket disconnected.
- Redis marks user offline.

---

# 7. JWT & Refresh Tokens

## Access Token

- Short-lived
- Used on every protected request
- Contains authenticated user identity

## Refresh Token

- Long-lived
- Used only to generate a new access token
- Revoked during logout

Flow:

```text
Login
  │
  ▼
JWT + Refresh Token
  │
Protected APIs
  │
JWT Expires
  │
Refresh Endpoint
  │
New JWT
```

---

# 8. End-to-End Encryption

Encryption Pipeline

```text
Plaintext
   │
Generate Ephemeral Key
   │
ECDH
   │
HKDF
   │
AES-GCM
   │
Ciphertext
```

Database stores:

- Ciphertext
- IV
- Authentication Tag
- Ephemeral Public Key

No plaintext is stored.

---

# 9. Redis

Redis provides:

- Online presence
- Replay attack protection
- Socket.IO Pub/Sub
- Temporary cache
- Fast in-memory operations

---

# 10. Nginx

Responsibilities:

- HTTPS termination
- Reverse proxy
- Static file hosting
- WebSocket upgrade
- Compression
- Load balancing
- Rate limiting

---

# 11. Docker

Docker Compose starts:

- Frontend
- Backend
- PostgreSQL
- Redis
- Nginx

Benefits:

- Consistent environments
- Easy deployment
- Container isolation
- Simple scaling

---

# 12. Database Design

## Users
- id
- username
- email
- password_hash

## PublicKeys
- user_id
- public_key
- fingerprint

## Contacts
- sender
- receiver
- status

## Messages
- sender
- receiver
- ciphertext
- iv
- auth_tag
- ephemeral_public_key
- timestamp

## RefreshTokens
- token
- expiry
- user_id

---

# 13. Folder Structure

```text
project/
├── frontend/
├── backend/
│   ├── auth/
│   ├── contacts/
│   ├── messages/
│   ├── socket/
│   ├── db/
│   └── server.js
├── nginx/
├── docker-compose.yml
└── README.md
```

---

# 14. Security Features

- bcrypt password hashing
- JWT authentication
- Refresh token rotation
- End-to-End Encryption
- ECDH key exchange
- HKDF key derivation
- AES-GCM authenticated encryption
- Forward secrecy using ephemeral keys
- Replay attack prevention
- SQL injection protection through ORM
- HTTPS via Nginx

---

# 15. Future Enhancements

- Group messaging
- Voice & video calls
- File encryption
- Push notifications
- Multi-device support
- Message search
- Backup and recovery

---

# 16. Conclusion

LinkMe demonstrates a modern secure messaging architecture that combines JWT authentication, Redis, PostgreSQL, Socket.IO, Docker, and Nginx with browser-side End-to-End Encryption using ECDH, HKDF, and AES-GCM. By ensuring that encryption and decryption occur exclusively on client devices, the platform provides confidentiality, integrity, and forward secrecy while allowing secure, scalable, real-time communication.
