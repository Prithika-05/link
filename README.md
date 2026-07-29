
# LinkMe – End-to-End Encrypted Messaging Application

> A secure, real-time messaging platform implementing End-to-End Encryption (E2EE), JWT authentication, Redis caching, Socket.IO communication, Docker containerization, and Nginx reverse proxying.

 Access Linkchat: https://linkchat.duckdns.org/
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

You can add the following section directly after your **Docker** section in the README as a continuation.

---

# 11. Deployment

The application is deployed on **Amazon Web Services (AWS)** using an **EC2 Ubuntu Server**. The deployment uses **Docker Compose** to orchestrate all application services and **Nginx** as a reverse proxy. A **DuckDNS** domain points to an **AWS Elastic IP**, allowing users to access the application through a permanent domain name instead of a changing public IP address.

## Deployment Architecture

```text
                    Internet
                        │
                        ▼
             https://linkme.duckdns.org
                        │
                  DuckDNS DNS
                        │
                        ▼
                 AWS Elastic IP
                        │
                        ▼
                AWS EC2 Instance
                 Ubuntu 22.04 LTS
                        │
                  Docker Compose
                        │
      ┌─────────────────┼─────────────────┐
      ▼                 ▼                 ▼
    Nginx          Fastify API         Redis
                         │
                         ▼
                   PostgreSQL
```

---

# 12. AWS Infrastructure

The project is hosted on an **Amazon EC2** virtual machine running Ubuntu Linux.

The EC2 instance hosts the complete Docker environment, including:

* Frontend
* Backend API
* PostgreSQL
* Redis
* Nginx

An **Elastic IP Address** is attached to the EC2 instance to ensure the server always has the same public IP address.

Without an Elastic IP:

```text
EC2 Restart

↓

Public IP Changes

↓

Domain Stops Working
```

With an Elastic IP:

```text
EC2 Restart

↓

Elastic IP Remains Same

↓

Application Always Accessible
```

---

# 13. Elastic IP Configuration

After launching the EC2 instance:

1. Allocate a new Elastic IP.
2. Associate it with the EC2 instance.
3. Verify the instance is reachable using the Elastic IP.

Example:

```text
AWS Console

↓

Elastic IP

↓

Allocate Address

↓

Associate

↓

EC2 Instance

↓

44.xxx.xxx.xxx
```

The Elastic IP becomes the permanent public address of the application.

---

# 14. DuckDNS Domain Configuration

To avoid accessing the application using an IP address, a **DuckDNS** subdomain is configured.

Example:

```text
linkme.duckdns.org
```

DuckDNS maps the domain to the AWS Elastic IP.

```text
linkme.duckdns.org

↓

DNS Lookup

↓

44.xxx.xxx.xxx

↓

EC2 Instance
```

Now users access the application using:

```text
https://linkme.duckdns.org
```

instead of

```text
http://44.xxx.xxx.xxx
```

This provides a user-friendly domain name while still using a free DNS provider.

---

# 15. Docker Deployment

Docker is used to isolate every service into its own container.

The application consists of the following containers:

```text
Docker Engine

├── Frontend Container

├── Backend Container

├── PostgreSQL Container

├── Redis Container

└── Nginx Container
```

Docker Compose automatically:

* Builds images
* Creates containers
* Creates an internal Docker network
* Starts services in the correct order
* Restarts failed containers

Application startup:

```bash
docker compose up -d
```

Docker Compose then launches all services simultaneously.

---

# 16. Nginx Reverse Proxy

Nginx is the public entry point of the application.

Instead of exposing the Fastify backend directly, all incoming traffic passes through Nginx.

```text
Browser

↓

HTTPS

↓

Nginx

↓

Fastify Backend
```

Nginx provides:

* Reverse Proxy
* HTTPS support
* Static file hosting
* WebSocket forwarding
* Compression
* Load balancing (future scalability)
* Rate limiting
* Request filtering

This improves both performance and security.

---

# 17. HTTPS Communication

All communication between the client and server is encrypted using HTTPS.

```text
Browser

↓

HTTPS

↓

Nginx

↓

HTTP (Internal Docker Network)

↓

Fastify
```

Since the backend communicates only inside Docker, external users never access it directly.

---

# 18. Docker Networking

Docker Compose automatically creates an isolated internal network.

```text
Docker Network

│

├── frontend

├── backend

├── postgres

├── redis

└── nginx
```

Services communicate using container names instead of IP addresses.

Example:

```text
Backend

↓

postgres:5432
```

instead of

```text
192.168.x.x
```

This simplifies deployment and improves portability.

---

# 19. Environment Variables

Sensitive configuration values are stored inside a `.env` file.

Example:

```env
DATABASE_URL=postgres://username:password@postgres:5432/linkme

JWT_SECRET=your_secret_key

REDIS_URL=redis://redis:6379

NODE_ENV=production

PORT=3000

DUCKDNS_DOMAIN=linkme.duckdns.org

DUCKDNS_TOKEN=your_duckdns_token
```

Using environment variables prevents sensitive information from being hard-coded into the application.

---

# 20. Deployment Workflow

The complete deployment process is illustrated below.

```text
Developer

↓

GitHub Repository

↓

Clone Repository

↓

AWS EC2 Instance

↓

Docker Compose Build

↓

Docker Containers Start

↓

Nginx

↓

Fastify Backend

↓

Redis + PostgreSQL

↓

Application Online
```

---

# 21. Production Request Flow

Once deployed, every user request follows the same path.

```text
User

↓

https://linkme.duckdns.org

↓

DuckDNS

↓

Elastic IP

↓

AWS EC2

↓

Nginx

↓

Fastify

↓

JWT Authentication

↓

Redis

↓

PostgreSQL

↓

Response

↓

Browser
```

For messaging:

```text
John Sends Message

↓

Browser Encrypts Message

↓

HTTPS

↓

DuckDNS

↓

Elastic IP

↓

Nginx

↓

Fastify

↓

Redis Replay Protection

↓

PostgreSQL Stores Ciphertext

↓

Socket.IO Notification

↓

Alice Downloads Ciphertext

↓

Browser Decrypts Message
```

---

# 22. Benefits of the Deployment

The deployment architecture provides several advantages:

* **AWS EC2** hosts the application in a reliable cloud environment.
* **Elastic IP** ensures the server always has the same public IP address.
* **DuckDNS** provides a human-readable domain without purchasing a commercial domain.
* **Docker Compose** simplifies deployment and service orchestration.
* **Nginx** improves security, performance, and scalability by acting as a reverse proxy.
* **Redis** enhances real-time communication and performance through caching, presence tracking, and Pub/Sub.
* **PostgreSQL** provides reliable persistent storage for application data.
* **HTTPS** encrypts all communication between clients and the server.

---

This deployment architecture enables the LinkMe application to be securely accessible from anywhere on the internet while maintaining a scalable, maintainable, and production-ready infrastructure.


# 23. Conclusion

LinkMe demonstrates a modern secure messaging architecture that combines JWT authentication, Redis, PostgreSQL, Socket.IO, Docker, and Nginx with browser-side End-to-End Encryption using ECDH, HKDF, and AES-GCM. By ensuring that encryption and decryption occur exclusively on client devices, the platform provides confidentiality, integrity, and forward secrecy while allowing secure, scalable, real-time communication.
