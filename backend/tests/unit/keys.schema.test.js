import { describe, it, expect, beforeAll } from "vitest";
import Ajv from "ajv";
import {
  uploadKeySchema,
  getKeySchema,
} from "../../src/modules/keys/keys.schema.js";

let validateUpload;
let validateGetParams;

beforeAll(() => {
  const ajv = new Ajv({ allErrors: true });
  validateUpload = ajv.compile(uploadKeySchema.body);
  validateGetParams = ajv.compile(getKeySchema.params);
});

describe("uploadKeySchema", () => {
  const validKey = {
    algorithm: "ECDH-P256",
    key: "BASE64-PUBLIC-KEY-JWK-OR-RAW",
    fingerprint: "a".repeat(64),
  };

  it("accepts a valid ECDH-P256 key", () => {
    expect(validateUpload(validKey)).toBe(true);
  });

  it("rejects an unsupported algorithm", () => {
    expect(
      validateUpload({
        ...validKey,
        algorithm: "RSA-1024",
      }),
    ).toBe(false);
  });

  it("rejects a fingerprint that is too short", () => {
    expect(
      validateUpload({
        ...validKey,
        fingerprint: "short",
      }),
    ).toBe(false);
  });

  it("rejects a fingerprint that is too long", () => {
    expect(
      validateUpload({
        ...validKey,
        fingerprint: "a".repeat(200),
      }),
    ).toBe(false);
  });

  it("rejects when the key field is empty", () => {
    expect(
      validateUpload({
        ...validKey,
        key: "",
      }),
    ).toBe(false);
  });

  it("rejects unexpected properties", () => {
    expect(
      validateUpload({
        ...validKey,
        privateKey: "attempting-to-upload-private-key",
      }),
    ).toBe(false);
  });
});

describe("getKeySchema", () => {
  it("requires userId in params", () => {
    expect(validateGetParams({})).toBe(false);
    expect(validateGetParams({ userId: "clh123" })).toBe(true);
  });
});
