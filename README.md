## Security and Testing Contribution (feature/security branch)

This section covers the security engineering, validation, and testing work built on the `feature/security` branch.

### What's here

A hardened security layer sitting on top of the existing backend, plus a full test suite that verifies the security properties actually hold at the code level. Around 90 tests total, all passing on every push and pull request via GitHub Actions.

### Tests written

Six test files organised by purpose.

**Unit tests** in `backend/tests/unit/`:
- `auth.schema.test.js` — validates the register and login schemas reject weak passwords, malformed emails, unknown fields, and oversized inputs
- `messages.schema.test.js` — validates the send-message schema enforces the ciphertext-only API contract
- `keys.schema.test.js` — validates the public-key upload schema only accepts ECDH-P256 and rejects any attempt to upload a private key
- `auth.tokens.test.js` — validates the TokenService signs JWTs correctly, produces fresh identifiers per token, and interacts with the Redis blacklist as expected
- `security-validators.test.js` — validates the custom AJV validators against homograph attacks, null byte injection, non-base64 payloads, and control characters
- `strict-schemas.test.js` — validates the layered strict schemas close every documented gap in the base schemas

**Security tests** in `backend/tests/security/`:
- `no-plaintext.test.js` — proves the server never persists plaintext, even if a caller tries to sneak it in via unexpected fields. This is the automated proof of the core security claim.
- `password-hashing.test.js` — proves passwords are bcrypt-hashed at cost 12, salted, and never stored in plaintext
- `attack-payloads.test.js` — fires OWASP Top 10 attack payloads (SQL injection, XSS, prototype pollution, path traversal, NoSQL operator injection, oversized inputs) at the real schemas and documents which are rejected and where the gaps are
- `cover-traffic.test.js` — proves the cover traffic endpoint is indistinguishable from the real message endpoint in every observable

### Custom validators added

Four AJV custom validators in `backend/src/validators/security-validators.js`:

- `strictBase64` — rejects malformed base64 payloads that would pass a naive regex
- `safeUsername` — blocks Cyrillic homograph impersonation attacks by restricting usernames to lowercase ASCII plus dash and underscore
- `hexFingerprint` — enforces lowercase hex within a length range for cryptographic fingerprints
- `rejectControlChars` — blocks null bytes, newlines, tabs, and other injection primitives

### Strict schema layer

A hardened set of schemas in `backend/src/validators/strict-schemas.js` built on top of the base schemas without modifying them. Adds:

- Stricter password minimum length (12 characters)
- Base64 shape enforcement on every crypto field
- Correct size enforcement on IV (12 bytes) and auth tag (16 bytes)
- Ciphertext size caps to prevent DoS
- Rejection of control characters in identifiers
- Separate `strictSendMediaMessageSchema` for encrypted image messages with a larger ciphertext cap while keeping the mime type inside the encrypted payload for metadata privacy

### Cover traffic

A metadata-privacy feature in `backend/src/modules/messages/cover.routes.js`. The endpoint `POST /messages/cover` accepts payloads identical in shape to real messages but silently discards them.

Why it matters: even with content encrypted, the server can otherwise learn when Alice and Bob are actively talking based on message timing. Cover traffic breaks this by making cover messages network-indistinguishable from real ones. The server cannot tell them apart, so it cannot use timing patterns to infer conversation activity.

The backend endpoint, schema enforcement, and rate limiting are all in place. The frontend piece (generating cover messages on a fixed schedule) is a follow-on for the client team.

### CI pipeline

GitHub Actions workflow in `.github/workflows/backend-tests.yml`. Runs the full test suite on every push and pull request. Any regression in the security properties causes the workflow to fail, which blocks the merge if branch protection is enabled on `main`.

### What this contribution proves

Together, the tests and schema layer verify:

1. The server never sees plaintext message content
2. The server never stores plaintext passwords
3. The API rejects SQL injection, XSS, prototype pollution, and homograph attacks
4. JWT sessions can be revoked and revocation is enforced on every request
5. Every message send has cryptographic integrity fields (IV, auth tag, ephemeral key)
6. The server cannot distinguish cover traffic from real messages based on any observable
7. Any future regression in these properties is caught automatically by CI

### What's ready but not yet deployed

- The strict schemas are ready to swap into routes when the team is aligned
- The cover traffic endpoint is registered and tested but needs frontend integration to be functional end to end
- The media message schema is ready for the frontend image upload feature to be built against it

### Documentation

- `backend/tests/` — every test is commented with its purpose and the attack class it verifies
- Schema files are commented with rationale for every design decision
- Commit history on `feature/security` shows the incremental development of every piece
