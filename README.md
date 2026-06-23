# Link Me — End-to-End Encrypted Web Messenger

Link Me is a browser-based messaging app built for our Computer Systems Security module. The central idea is simple: two people can message each other and the server never sees the content of any message. All encryption happens in the browser using the Web Crypto API. The backend exists only to route ciphertext and manage accounts and it is treated as a potential adversary in our threat model.

---

## Table of Contents

1. [What It Does](#what-it-does)
2. [Encryption Flow](#encryption-flow)
3. [Threat Model](#threat-model)
4. [Tech Stack](#tech-stack)
5. [Repo Layout](#repo-layout)
6. [Deployment](#deployment)
7. [AI Attribution](#ai-attribution)

---

## What It Does

- Users register with a username and password. On registration, an ECDH P-256 key pair is generated in the browser.
- The public key is published to the user's personal GitHub Pages site. The private key never leaves the browser.
- To start a conversation, you enter the other person's GitHub Pages URL. The app fetches their public key directly from there.
- For each message sent, a fresh ephemeral ECDH key pair is generated. A shared secret is derived via ECDH, then used to derive an AES-GCM key via HKDF. The message is encrypted with that key, and the ephemeral public key is sent alongside the ciphertext so the recipient can derive the same secret.
- The server stores and forwards ciphertext only. It cannot decrypt anything.
- WebSockets handle real-time delivery notifications so the UI updates without polling.

---

## Encryption Flow

This is the per-message flow, step by step:

```
Sender                                    Recipient
------                                    ---------
1. Fetch recipient's public key
   from their GitHub Pages URL

2. Generate ephemeral ECDH key pair
   (new pair per message)

3. ECDH(ephemeral private, recipient public)
   → raw shared secret

4. HKDF(shared secret, salt, "Link v1")
   → 256-bit AES-GCM key

5. Generate random 12-byte IV

6. AES-GCM encrypt(plaintext, key, IV)
   → ciphertext + auth tag

7. Send to server:
   { ephemeralPublicKey, IV, ciphertext }
                                          8. Receive ciphertext bundle

                                          9. ECDH(recipient private,
                                             ephemeralPublicKey)
                                             → same shared secret

                                          10. HKDF(shared secret, salt, "Link v1")
                                              → same AES-GCM key

                                          11. AES-GCM decrypt(ciphertext, key, IV)
                                              → plaintext
```

**Why ephemeral keys per message?**
If a long-term private key is ever compromised, past messages stay protected because each one was encrypted under a different derived key. This gives forward secrecy at the message level.

**Why GitHub Pages for public keys?**
It avoids trusting the server as a key directory. If the server hosted public keys, a malicious server could substitute its own key and run a man-in-the-middle attack. GitHub Pages gives each user a URL they control independently of the Link server.

**Key derivation details:**
- Curve: P-256
- KDF: HKDF with SHA-256, info string `"Link v1"`
- Symmetric cipher: AES-GCM, 256-bit key, 96-bit IV (randomly generated per message)
- All operations use the browser's native `window.crypto.subtle` API

---

## Threat Model

**What we protect against:**

| Threat | Mitigation |
|---|---|
| Curious/compromised server reading messages | All encryption in browser; server only sees ciphertext |
| Replay attacks | Each message has a unique IV and ephemeral key |
| Stolen long-term private key exposing past messages | Ephemeral keys per message (forward secrecy) |
| JWT theft enabling session hijacking | Short-lived JWTs + Redis blacklist on logout |
| Brute-force login | bcrypt password hashing + rate limiting on auth endpoints |
| Key substitution by server | Public keys hosted on user-controlled GitHub Pages, not server |

**What we do NOT protect against (out of scope):**

- **Endpoint compromise.** If the recipient's device or browser is compromised, an attacker can read decrypted messages. This is true of all E2EE systems.
- **Key verification / TOFU.** We do not implement a safety number or fingerprint comparison mechanism. A user could point their Link profile at someone else's GitHub Pages URL. In a production system you would want out-of-band key verification.
- **Metadata.** The server knows who is talking to whom, when, and how often. Only message content is hidden.
- **Denial of service.** Rate limiting is basic and not production-grade.
- **GitHub Pages availability.** If a user's GitHub Pages site is down, their public key cannot be fetched.

---

## Tech Stack

**Backend**
- Node.js + Express (CommonJS)
- PostgreSQL via Neon (hosted)
- Prisma ORM
- Redis via Upstash (JWT blacklisting)
- WebSockets (`ws` library) for real-time notifications

**Frontend**
- React + Vite
- Web Crypto API (built into modern browsers, no third-party crypto library)

**Infrastructure**
- Backend hosted on Render
- Frontend hosted on Vercel
- Public keys hosted on each user's GitHub Pages

---

## Repo Layout

```
link/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── routes/
│   │   │   ├── auth.js            # Register, login, logout
│   │   │   └── messages.js        # Send, fetch messages
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verification middleware
│   │   │   └── rateLimit.js       # Rate limiting
│   │   ├── services/
│   │   │   ├── redis.js           # JWT blacklist logic
│   │   │   └── websocket.js       # WebSocket notification handler
│   │   └── index.js               # Express app entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/            # React UI components
│   │   ├── crypto/
│   │   │   └── messaging.js       # All Web Crypto API logic
│   │   ├── api/                   # API client functions
│   │   ├── pages/                 # Route-level components
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## Deployment

| Service | Purpose | Free tier used |
|---|---|---|
| Render | Backend (Node/Express) | Yes |
| Vercel | Frontend (React/Vite) | Yes |
| Neon | PostgreSQL | Yes |
| Upstash | Redis | Yes |

Environment variables for the deployed backend and frontend follow the same structure as the local `.env` files above, set through each platform's dashboard.

---

## AI
Pramodh - https://claude.ai/share/c1981dfb-1b5b-4648-844e-b260218f5337
