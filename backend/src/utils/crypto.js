// src/utils/crypto.js

import crypto from 'node:crypto';

/**
 * Generate a SHA-256 hash.
 *
 * @param {string|Buffer} value
 * @returns {string}
 */
export function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');
}

/**
 * Generate a public key fingerprint.
 *
 * Output example:
 * AB:12:CD:45:...
 *
 * @param {string|Buffer} publicKey
 * @returns {string}
 */
export function generateFingerprint(publicKey) {
  const hash = sha256(publicKey).toUpperCase();

  return hash.match(/.{1,2}/g).join(':');
}

/**
 * Generate a cryptographically secure random ID.
 *
 * @param {number} bytes
 * @returns {string}
 */
export function generateId(bytes = 16) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a secure nonce.
 *
 * @param {number} bytes
 * @returns {string}
 */
export function generateNonce(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Generate a secure random token.
 *
 * Useful for:
 *  - Refresh tokens
 *  - Device identifiers
 *  - Verification tokens
 *
 * @param {number} bytes
 * @returns {string}
 */
export function generateToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

/**
 * Timing-safe string comparison.
 *
 * Prevents timing attacks.
 *
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
export function safeCompare(a, b) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
}