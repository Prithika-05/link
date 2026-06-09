# Link

End-to-end encrypted web messenger built for B9IS103 (Computer Systems Security) at Dublin Business School.
Two people who've never met can message each other, and nobody in the middle — including our own server — can read what they're saying. That's the whole point.

## How it works

The first time you open the app, your browser generates a key pair. The private key stays in your browser. The public key goes up on your GitHub Pages site at a fixed path.

To send a message, your browser:
1. Looks up the recipient's public key from their GitHub Pages.
2. Generates a fresh ephemeral ECDH key pair for this message.
3. Derives a shared AES-GCM key with the recipient.
4. Encrypts the message and sends the ciphertext to our server.

The server stores it as opaque bytes and pings the recipient over a WebSocket. The recipient downloads the blob, runs the same key derivation with their private key plus the sender's ephemeral public key, and decrypts. The server never sees plaintext at any point.

## Threat model

We assume the server is **maliciously curious**. It executes our code correctly, but it tries to learn whatever it can from what passes through it. The design has to hold up under that assumption.

What the server **can** see:
- Who has an account (usernames, when they registered)
- Sender and recipient IDs on each message — we need this for routing
- Message sizes and timing

What the server **cannot** see:
- Message contents
- Private keys — they never leave the browser
- The per-message shared secret — ephemeral keys give us forward secrecy

Things we are not solving in this version: traffic analysis, sophisticated metadata correlation across users, or compromise of a user's own device. We document these as residual risks in `docs/threat-analysis.md` rather than pretend they don't exist.

## Identity — how Alice knows Bob is really Bob

We use GitHub Pages to host public keys. The trust chain is:

> HTTPS certificate → GitHub controls the subdomain → the user controls their GitHub account → therefore the key file at `https://<username>.github.io/link/keys.json` belongs to that user.

If you don't trust the certificate authority system or GitHub, you don't trust the identity claim. We're being explicit about that.

The obvious attacks here are GitHub account takeover and typosquatted usernames (e.g. `b0b` vs `bob`). The UI shows a warning when a contact's key changes from what you saw last time, which is our main mitigation. Full details in `docs/threat-analysis.md`.

## Stack

**Backend** — Node.js, Express (CommonJS), PostgreSQL via Prisma, Redis for JWT blacklisting, WebSockets via `ws`.

**Frontend** — React + Vite, Web Crypto API for everything cryptographic.

**Hosted on** — Render (backend), Vercel (frontend), Neon (Postgres), Upstash (Redis). All free tiers, all give us HTTPS by default.

**Crypto** — ECDH on P-256 for key exchange, AES-GCM with 256-bit keys for message encryption, fresh ephemeral keys per message.
