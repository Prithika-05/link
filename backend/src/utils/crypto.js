// src/utils/crypto.js

import crypto from 'node:crypto';

export function sha256(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');
}

export function sha256Base64(value) {
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('base64');
}

export function generateFingerprint(publicKey) {
  const hash = sha256(publicKey).toUpperCase();

  return hash.match(/.{1,2}/g).join(':');
}

export function generateId(bytes = 16) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function generateNonce(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

export function generateToken(bytes = 32) {
  return crypto
    .randomBytes(bytes)
    .toString('base64url');
}

export function generateUUID() {
  return crypto.randomUUID();
}

export function generateTimestamp() {
  return Date.now();
}

export function safeCompare(a, b) {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(
    bufferA,
    bufferB
  );
}