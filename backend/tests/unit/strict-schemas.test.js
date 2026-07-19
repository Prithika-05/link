// tests/unit/strict-schemas.test.js
//
// Purpose:
// Prove that the strict schemas close every gap we documented in
// attack-payloads.test.js. Where the base schemas were permissive, these
// strict schemas explicitly reject the attack.
//
// Also covers the media message schema which allows larger ciphertext
// for encrypted image payloads while keeping all other constraints.

import { describe, it, expect, beforeAll } from 'vitest';
import {
  createStrictAjv,
  strictRegisterSchema,
  strictLoginSchema,
  strictSendMessageSchema,
  strictSendMediaMessageSchema,
  strictUploadKeySchema,
} from '../../src/validators/strict-schemas.js';

let validateRegister;
let validateLogin;
let validateSend;
let validateSendMedia;
let validateUploadKey;

beforeAll(() => {
  const ajv = createStrictAjv();
  validateRegister = ajv.compile(strictRegisterSchema.body);
  validateLogin = ajv.compile(strictLoginSchema.body);
  validateSend = ajv.compile(strictSendMessageSchema.body);
  validateSendMedia = ajv.compile(strictSendMediaMessageSchema.body);
  validateUploadKey = ajv.compile(strictUploadKeySchema.body);
});

const validRegister = {
  username: 'pramodh',
  email: 'pramodh@example.com',
  password: 'strong-password-123',
};

const validSend = {
  receiverId: 'clh1234567890abcdefg',
  ciphertext: 'SGVsbG8gV29ybGQhIQ==',
  iv: 'AAECAwQFBgcICQoL',
  authTag: 'AAECAwQFBgcICQoLDA0ODw==',
  ephemeralPublicKey: 'A'.repeat(88),
};

// ---- Register: closing the SQL/XSS/null-byte gaps ----------------------

describe('strictRegisterSchema closes the gaps in base register schema', () => {
  it('rejects SQL injection in username', () => {
    expect(
      validateRegister({
        ...validRegister,
        username: "admin' OR '1'='1",
      })
    ).toBe(false);
  });

  it('rejects XSS payload in username', () => {
    expect(
      validateRegister({
        ...validRegister,
        username: '<script>alert(1)</script>',
      })
    ).toBe(false);
  });

  it('rejects null byte in username', () => {
    expect(
      validateRegister({
        ...validRegister,
        username: 'admin\x00',
      })
    ).toBe(false);
  });

  it('rejects Cyrillic homograph username', () => {
    expect(
      validateRegister({
        ...validRegister,
        username: 'аdmin',
      })
    ).toBe(false);
  });

  it('rejects null byte in email', () => {
    expect(
      validateRegister({
        ...validRegister,
        email: 'admin@example.com\x00',
      })
    ).toBe(false);
  });

  it('rejects control char in password', () => {
    expect(
      validateRegister({
        ...validRegister,
        password: 'valid-length-password\n',
      })
    ).toBe(false);
  });

  it('enforces stronger minimum password length (12 chars)', () => {
    expect(
      validateRegister({
        ...validRegister,
        password: 'short-11-c',
      })
    ).toBe(false);
  });

  it('accepts a well-formed registration', () => {
    expect(validateRegister(validRegister)).toBe(true);
  });
});

// ---- Login: closing the operator injection and control char gaps -------

describe('strictLoginSchema closes the gaps in base login schema', () => {
  it('rejects control chars in email', () => {
    expect(
      validateLogin({
        email: 'a@b.com\n',
        password: 'anything',
      })
    ).toBe(false);
  });

  it('rejects control chars in password', () => {
    expect(
      validateLogin({
        email: 'a@b.com',
        password: 'password\x00with-null',
      })
    ).toBe(false);
  });

  it('accepts a well-formed login', () => {
    expect(
      validateLogin({
        email: 'a@b.com',
        password: 'any-password',
      })
    ).toBe(true);
  });
});

// ---- Send Message: closing the size cap and base64 gaps ----------------

describe('strictSendMessageSchema closes gaps in base messages schema', () => {
  it('rejects ciphertext larger than the cap (DoS prevention)', () => {
    expect(
      validateSend({
        ...validSend,
        ciphertext: 'A'.repeat(360_001),
      })
    ).toBe(false);
  });

  it('rejects non-base64 ciphertext', () => {
    expect(
      validateSend({
        ...validSend,
        ciphertext: 'not real base64!@#$',
      })
    ).toBe(false);
  });

  it('rejects an IV that is the wrong size (must be 12 bytes = 16 b64 chars)', () => {
    expect(
      validateSend({
        ...validSend,
        iv: 'AA==',
      })
    ).toBe(false);
  });

  it('rejects an auth tag that is the wrong size (must be 16 bytes)', () => {
    expect(
      validateSend({
        ...validSend,
        authTag: 'AAECAwQ=',
      })
    ).toBe(false);
  });

  it('rejects an ephemeralPublicKey that is too short', () => {
    expect(
      validateSend({
        ...validSend,
        ephemeralPublicKey: 'AAECAw==',
      })
    ).toBe(false);
  });

  it('rejects control chars in receiverId', () => {
    expect(
      validateSend({
        ...validSend,
        receiverId: 'clh1234567890abcd\x00',
      })
    ).toBe(false);
  });

  it('accepts a well-formed send-message payload', () => {
    expect(validateSend(validSend)).toBe(true);
  });
});

// ---- Upload Key: closing the fingerprint format gap --------------------

describe('strictUploadKeySchema closes gaps in base keys schema', () => {
  it('rejects a non-hex fingerprint', () => {
    expect(
      validateUploadKey({
        algorithm: 'ECDH-P256',
        key: 'A'.repeat(88),
        fingerprint: 'not-a-hex-string-at-all-not-a-hex-string-at-all-not-a-hex-str1234',
      })
    ).toBe(false);
  });

  it('rejects an uppercase hex fingerprint', () => {
    expect(
      validateUploadKey({
        algorithm: 'ECDH-P256',
        key: 'A'.repeat(88),
        fingerprint: 'A'.repeat(64),
      })
    ).toBe(false);
  });

  it('rejects a non-base64 public key', () => {
    expect(
      validateUploadKey({
        algorithm: 'ECDH-P256',
        key: 'not real base64!@#$%^&*()',
        fingerprint: 'a'.repeat(64),
      })
    ).toBe(false);
  });

  it('accepts a well-formed key upload', () => {
    expect(
      validateUploadKey({
        algorithm: 'ECDH-P256',
        key: 'A'.repeat(88),
        fingerprint: 'a'.repeat(64),
      })
    ).toBe(true);
  });
});

// ---- Media message schema tests -----------------------------------------

describe('strictSendMediaMessageSchema for encrypted image/media messages', () => {
  const validMedia = {
    receiverId: 'clh1234567890abcdefg',
    ciphertext: 'A'.repeat(200_000),
    iv: 'AAECAwQFBgcICQoL',
    authTag: 'AAECAwQFBgcICQoLDA0ODw==',
    ephemeralPublicKey: 'A'.repeat(88),
  };

  it('accepts a media-sized ciphertext (larger than text schema allows)', () => {
    expect(validateSendMedia(validMedia)).toBe(true);
  });

  it('accepts ciphertext just under the media cap', () => {
    expect(
      validateSendMedia({
        ...validMedia,
        ciphertext: 'A'.repeat(419_996),
      })
    ).toBe(true);
  });

  it('rejects ciphertext larger than the media cap (DoS prevention)', () => {
    expect(
      validateSendMedia({
        ...validMedia,
        ciphertext: 'A'.repeat(420_001),
      })
    ).toBe(false);
  });

  it('rejects non-base64 ciphertext', () => {
    expect(
      validateSendMedia({
        ...validMedia,
        ciphertext: 'not real base64!@#$',
      })
    ).toBe(false);
  });

  it('rejects unexpected properties like an unencrypted mimeType', () => {
    // The mime type must be inside the encrypted payload, not a top-level
    // field. This test enforces that at the schema layer.
    expect(
      validateSendMedia({
        ...validMedia,
        mimeType: 'image/jpeg',
      })
    ).toBe(false);
  });

  it('rejects control chars in receiverId', () => {
    expect(
      validateSendMedia({
        ...validMedia,
        receiverId: 'clh1234567890abcd\x00',
      })
    ).toBe(false);
  });

  it('has the same required fields as the text message schema', () => {
    const requiredFields = [
      'receiverId',
      'ciphertext',
      'iv',
      'authTag',
      'ephemeralPublicKey',
    ];
    for (const field of requiredFields) {
      const invalid = { ...validMedia };
      delete invalid[field];
      expect(validateSendMedia(invalid)).toBe(false);
    }
  });
});