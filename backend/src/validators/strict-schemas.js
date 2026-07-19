// src/validators/strict-schemas.js
//
// Hardened schema versions layered on top of the base module schemas.
//
// These schemas add the strict validators from security-validators.js as
// custom AJV keywords. They can be used in new routes without touching the
// existing base schemas, providing defence-in-depth without conflicting
// with other team members' code.

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { registerSecurityValidators } from './security-validators.js';

// Build a shared AJV instance with security validators registered.
// Consumers can import this to compile any strict schema.
export function createStrictAjv() {
  const ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  registerSecurityValidators(ajv);
  return ajv;
}

// ---- Strict Register ----------------------------------------------------

export const strictRegisterSchema = {
  body: {
    type: 'object',
    required: ['username', 'email', 'password'],
    additionalProperties: false,
    properties: {
      username: {
        type: 'string',
        minLength: 3,
        maxLength: 30,
        // Blocks homograph attacks, control chars, SQL/XSS payloads.
        safeUsername: true,
      },
      email: {
        type: 'string',
        format: 'email',
        maxLength: 254,
        rejectControlChars: true,
      },
      password: {
        type: 'string',
        minLength: 12,
        maxLength: 128,
        rejectControlChars: true,
      },
    },
  },
};

// ---- Strict Login -------------------------------------------------------

export const strictLoginSchema = {
  body: {
    type: 'object',
    required: ['email', 'password'],
    additionalProperties: false,
    properties: {
      email: {
        type: 'string',
        format: 'email',
        maxLength: 254,
        rejectControlChars: true,
      },
      password: {
        type: 'string',
        maxLength: 128,
        rejectControlChars: true,
      },
    },
  },
};

// ---- Strict Send Message -----------------------------------------------
//
// This is the important one. It bounds ciphertext size to prevent DoS
// and enforces base64 shape on every crypto field. Also caps IV and
// authTag to their real cryptographic sizes.

export const strictSendMessageSchema = {
  body: {
    type: 'object',
    required: [
      'receiverId',
      'ciphertext',
      'iv',
      'authTag',
      'ephemeralPublicKey',
    ],
    additionalProperties: false,
    properties: {
      receiverId: {
        type: 'string',
        minLength: 20,
        maxLength: 40,
        rejectControlChars: true,
      },
      // Ciphertext: any base64 up to 256 KB decoded (~350 KB base64).
      // This keeps text messages fast and prevents DoS via massive payloads.
      ciphertext: {
        type: 'string',
        minLength: 1,
        maxLength: 360_000,
        strictBase64: true,
      },
      // AES-GCM IV is 12 bytes = 16 base64 characters.
      iv: {
        type: 'string',
        minLength: 16,
        maxLength: 24,
        strictBase64: true,
      },
      // AES-GCM auth tag is 16 bytes = 24 base64 characters (with padding).
      authTag: {
        type: 'string',
        minLength: 20,
        maxLength: 28,
        strictBase64: true,
      },
      // ECDH-P256 raw public key is 65 bytes = ~88 base64 characters.
      // JWK format is longer, so we allow a range.
      ephemeralPublicKey: {
        type: 'string',
        minLength: 80,
        maxLength: 500,
        strictBase64: true,
      },
    },
  },
};

// ---- Strict Upload Key --------------------------------------------------

export const strictUploadKeySchema = {
  body: {
    type: 'object',
    required: ['algorithm', 'key', 'fingerprint'],
    additionalProperties: false,
    properties: {
      algorithm: {
        type: 'string',
        enum: ['ECDH-P256'],
      },
      key: {
        type: 'string',
        minLength: 80,
        maxLength: 500,
        strictBase64: true,
      },
      fingerprint: {
        type: 'string',
        hexFingerprint: { minLength: 64, maxLength: 128 },
      },
    },
  },
};