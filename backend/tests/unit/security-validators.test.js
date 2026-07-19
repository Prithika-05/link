// tests/unit/security-validators.test.js
//
// Purpose:
// Test the custom validators in isolation. Each test targets a specific
// attack pattern so we can point at it during presentation and say
// "this test proves this attack is blocked".

import { describe, it, expect } from "vitest";
import {
  isStrictBase64,
  isSafeUsername,
  isHexFingerprint,
  hasControlCharacters,
} from "../../src/validators/security-validators.js";

describe("isStrictBase64", () => {
  it("accepts a well-formed base64 string", () => {
    expect(isStrictBase64("SGVsbG8gV29ybGQ=")).toBe(true);
  });

  it("accepts base64 without padding when length is a multiple of 4", () => {
    expect(isStrictBase64("SGVsbG9Xb3JsZA==")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isStrictBase64("")).toBe(false);
  });

  it("rejects strings containing spaces", () => {
    expect(isStrictBase64("SGVsbG8g V29ybGQ=")).toBe(false);
  });

  it("rejects strings with invalid base64 characters", () => {
    expect(isStrictBase64("Hello!@#$%^&*()")).toBe(false);
  });

  it("rejects strings whose length is not a multiple of 4", () => {
    expect(isStrictBase64("SGVsbG8")).toBe(false);
  });

  it("rejects non-string input", () => {
    expect(isStrictBase64(null)).toBe(false);
    expect(isStrictBase64(undefined)).toBe(false);
    expect(isStrictBase64(12345)).toBe(false);
    expect(isStrictBase64({})).toBe(false);
  });
});

describe("isSafeUsername", () => {
  it("accepts a lowercase alphanumeric username", () => {
    expect(isSafeUsername("pramodh")).toBe(true);
  });

  it("accepts usernames with underscores and dashes", () => {
    expect(isSafeUsername("user_name-123")).toBe(true);
  });

  it("rejects usernames shorter than 3 characters", () => {
    expect(isSafeUsername("ab")).toBe(false);
  });

  it("rejects usernames longer than 30 characters", () => {
    expect(isSafeUsername("a".repeat(31))).toBe(false);
  });

  it("rejects usernames with uppercase letters", () => {
    expect(isSafeUsername("Pramodh")).toBe(false);
  });

  it("rejects Cyrillic homograph attack (looks like Latin but is not)", () => {
    // The 'а' here is Cyrillic (U+0430), not Latin 'a' (U+0061).
    // Visually identical, cryptographically different.
    // Without strict validation an attacker could impersonate 'admin'.
    expect(isSafeUsername("аdmin")).toBe(false);
  });

  it("rejects usernames containing spaces", () => {
    expect(isSafeUsername("john doe")).toBe(false);
  });

  it("rejects usernames with special characters", () => {
    expect(isSafeUsername("user@name")).toBe(false);
    expect(isSafeUsername("user.name")).toBe(false);
    expect(isSafeUsername("user'name")).toBe(false);
  });

  it("rejects SQL injection attempt embedded in username", () => {
    expect(isSafeUsername("admin' OR '1'='1")).toBe(false);
  });

  it("rejects non-string input", () => {
    expect(isSafeUsername(null)).toBe(false);
    expect(isSafeUsername(undefined)).toBe(false);
    expect(isSafeUsername(12345)).toBe(false);
  });
});

describe("isHexFingerprint", () => {
  it("accepts a lowercase hex string of default length", () => {
    expect(isHexFingerprint("a".repeat(64))).toBe(true);
  });

  it("accepts realistic SHA-256-style fingerprint", () => {
    expect(
      isHexFingerprint(
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      ),
    ).toBe(true);
  });

  it("rejects uppercase hex (must be lowercase)", () => {
    expect(isHexFingerprint("A".repeat(64))).toBe(false);
  });

  it("rejects strings that are too short", () => {
    expect(isHexFingerprint("abc")).toBe(false);
  });

  it("rejects strings that are too long", () => {
    expect(isHexFingerprint("a".repeat(200))).toBe(false);
  });

  it("rejects non-hex characters", () => {
    expect(isHexFingerprint("g".repeat(64))).toBe(false);
    expect(isHexFingerprint("z".repeat(64))).toBe(false);
  });

  it("respects custom min and max length parameters", () => {
    expect(isHexFingerprint("abcdef", 6, 6)).toBe(true);
    expect(isHexFingerprint("abcdef", 8, 16)).toBe(false);
  });
});

describe("hasControlCharacters", () => {
  it("returns false for a clean string", () => {
    expect(hasControlCharacters("hello world")).toBe(false);
  });

  it("detects a null byte injection", () => {
    // Classic attack: attacker sends "admin\x00" hoping downstream code
    // truncates at the null byte and treats them as "admin".
    expect(hasControlCharacters("admin\x00")).toBe(true);
  });

  it("detects a newline injection (log injection)", () => {
    // Newlines injected into log-forwarded fields can be used to forge fake
    // log entries. Reject them at input time.
    expect(hasControlCharacters("user\nFAKE LOG ENTRY")).toBe(true);
  });

  it("detects a tab character", () => {
    expect(hasControlCharacters("user\tname")).toBe(true);
  });

  it("detects a carriage return", () => {
    expect(hasControlCharacters("user\rname")).toBe(true);
  });

  it("detects the DEL character (0x7F)", () => {
    expect(hasControlCharacters("user\x7Fname")).toBe(true);
  });

  it("returns false for regular unicode letters (they are not control chars)", () => {
    expect(hasControlCharacters("café")).toBe(false);
    expect(hasControlCharacters("日本語")).toBe(false);
  });
});
