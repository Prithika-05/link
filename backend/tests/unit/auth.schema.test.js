import { describe, it, expect, beforeAll } from "vitest";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import {
  registerSchema,
  loginSchema,
} from "../../src/modules/auth/auth.schema.js";

let ajv;
let validateRegister;
let validateLogin;

beforeAll(() => {
  ajv = new Ajv({ allErrors: true });
  addFormats(ajv);
  validateRegister = ajv.compile(registerSchema.body);
  validateLogin = ajv.compile(loginSchema.body);
});

describe("registerSchema", () => {
  it("accepts a well-formed registration payload", () => {
    const ok = validateRegister({
      username: "pramodh",
      email: "pramodh@example.com",
      password: "a-strong-password-123",
    });
    expect(ok).toBe(true);
  });

  it("rejects when username is too short", () => {
    const ok = validateRegister({
      username: "ab",
      email: "pramodh@example.com",
      password: "a-strong-password-123",
    });
    expect(ok).toBe(false);
  });

  it("rejects when password is shorter than 8 characters", () => {
    const ok = validateRegister({
      username: "pramodh",
      email: "pramodh@example.com",
      password: "short",
    });
    expect(ok).toBe(false);
  });

  it("rejects a malformed email", () => {
    const ok = validateRegister({
      username: "pramodh",
      email: "not-an-email",
      password: "a-strong-password-123",
    });
    expect(ok).toBe(false);
  });

  it("rejects unexpected properties (additionalProperties: false)", () => {
    // If additionalProperties leaked through, an attacker could try to inject
    // fields like `isAdmin: true` and hope the service picks them up.
    const ok = validateRegister({
      username: "pramodh",
      email: "pramodh@example.com",
      password: "a-strong-password-123",
      isAdmin: true,
    });
    expect(ok).toBe(false);
  });

  it("rejects when required fields are missing", () => {
    const ok = validateRegister({
      email: "pramodh@example.com",
      password: "a-strong-password-123",
    });
    expect(ok).toBe(false);
  });

  it("rejects when password exceeds max length", () => {
    // 129 characters, one over the limit
    const ok = validateRegister({
      username: "pramodh",
      email: "pramodh@example.com",
      password: "x".repeat(129),
    });
    expect(ok).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts a valid login payload", () => {
    const ok = validateLogin({
      email: "pramodh@example.com",
      password: "any-password",
    });
    expect(ok).toBe(true);
  });

  it("rejects when email is missing", () => {
    const ok = validateLogin({ password: "any-password" });
    expect(ok).toBe(false);
  });

  it("rejects when password is missing", () => {
    const ok = validateLogin({ email: "pramodh@example.com" });
    expect(ok).toBe(false);
  });

  it("rejects unexpected properties", () => {
    const ok = validateLogin({
      email: "pramodh@example.com",
      password: "any-password",
      role: "admin",
    });
    expect(ok).toBe(false);
  });
});
