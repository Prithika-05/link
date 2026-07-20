// src/validators/security-validators.js
//
// Custom validators for defence-in-depth on API input.
//
// These are additional, stricter checks that sit alongside the base AJV
// schemas. They exist because format: 'email' or minLength: 3 are not enough
// to stop attacks like homograph impersonation, null byte injection, or
// prototype pollution.
//
// Each validator is exported both as a plain function (usable in tests) and
// as an AJV keyword factory (usable inside schemas).

// ---- Regex constants ----------------------------------------------------

// Strict base64: A-Z, a-z, 0-9, +, /, with optional = padding at the end.
// Length must be a multiple of 4. This is the RFC 4648 alphabet.
const BASE64_REGEX =
  /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

// Safe username: lowercase letters, digits, dash, underscore.
// Deliberately excludes Unicode to prevent homograph attacks
// (e.g. Cyrillic 'а' looking identical to Latin 'a').
const SAFE_USERNAME_REGEX = /^[a-z0-9_-]+$/;

// Hex string: 0-9, a-f (lowercase). Used for cryptographic fingerprints.
const HEX_REGEX = /^[a-f0-9]+$/;

// Control characters: null bytes, tab, newline, and other non-printable ASCII.
// Present in a string, these are red flags for injection attempts.
// eslint-disable-next-line no-control-regex
const CONTROL_CHAR_REGEX = /[\x00-\x1F\x7F]/;

// ---- Plain-function validators ------------------------------------------
//
// These are the ones we test in tests/unit/security-validators.test.js.

export function isStrictBase64(value) {
  if (typeof value !== "string") return false;
  if (value.length === 0) return false;
  // Length must be a multiple of 4 for valid base64.
  if (value.length % 4 !== 0) return false;
  return BASE64_REGEX.test(value);
}

export function isSafeUsername(value) {
  if (typeof value !== "string") return false;
  if (value.length < 3 || value.length > 30) return false;
  return SAFE_USERNAME_REGEX.test(value);
}

export function isHexFingerprint(value, minLength = 32, maxLength = 128) {
  if (typeof value !== "string") return false;
  if (value.length < minLength || value.length > maxLength) return false;
  return HEX_REGEX.test(value);
}

export function hasControlCharacters(value) {
  if (typeof value !== "string") return false;
  return CONTROL_CHAR_REGEX.test(value);
}

// ---- AJV keyword factories ----------------------------------------------
//
// These wrap the plain functions so they can be plugged into JSON schemas
// via keywords like { "strictBase64": true } or { "safeUsername": true }.
//
// Usage:
//   const ajv = new Ajv();
//   registerSecurityValidators(ajv);
//   ajv.compile({ type: 'string', strictBase64: true });

export function registerSecurityValidators(ajv) {
  ajv.addKeyword({
    keyword: "strictBase64",
    type: "string",
    schemaType: "boolean",
    validate: (schemaValue, data) => {
      if (!schemaValue) return true;
      return isStrictBase64(data);
    },
    errors: false,
  });

  ajv.addKeyword({
    keyword: "safeUsername",
    type: "string",
    schemaType: "boolean",
    validate: (schemaValue, data) => {
      if (!schemaValue) return true;
      return isSafeUsername(data);
    },
    errors: false,
  });

  ajv.addKeyword({
    keyword: "hexFingerprint",
    type: "string",
    schemaType: "object",
    validate: (schemaValue, data) => {
      const min = schemaValue.minLength || 32;
      const max = schemaValue.maxLength || 128;
      return isHexFingerprint(data, min, max);
    },
    errors: false,
  });

  ajv.addKeyword({
    keyword: "rejectControlChars",
    type: "string",
    schemaType: "boolean",
    validate: (schemaValue, data) => {
      if (!schemaValue) return true;
      return !hasControlCharacters(data);
    },
    errors: false,
  });

  return ajv;
}
