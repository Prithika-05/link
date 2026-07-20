import { describe, it, expect, beforeAll } from "vitest";
import Ajv from "ajv";
import {
  sendMessageSchema,
  conversationSchema,
} from "../../src/modules/messages/messages.schema.js";

let validateSend;
let validateConversationParams;
let validateConversationQuery;

beforeAll(() => {
  const ajv = new Ajv({ allErrors: true });
  validateSend = ajv.compile(sendMessageSchema.body);
  validateConversationParams = ajv.compile(conversationSchema.params);
  validateConversationQuery = ajv.compile(conversationSchema.querystring);
});

describe("sendMessageSchema", () => {
  const validPayload = {
    receiverId: "clh1234567890",
    ciphertext: "base64ciphertexthere==",
    iv: "base64iv==",
    authTag: "base64authtag==",
    ephemeralPublicKey: "base64ephemeralpubkey==",
  };

  it("accepts a valid ciphertext payload", () => {
    expect(validateSend(validPayload)).toBe(true);
  });

  it("rejects when ciphertext is missing", () => {
    const { ciphertext, ...rest } = validPayload;
    expect(validateSend(rest)).toBe(false);
  });

  it("rejects when iv is missing", () => {
    const { iv, ...rest } = validPayload;
    expect(validateSend(rest)).toBe(false);
  });

  it("rejects when authTag is missing", () => {
    const { authTag, ...rest } = validPayload;
    expect(validateSend(rest)).toBe(false);
  });

  it("rejects when ephemeralPublicKey is missing", () => {
    const { ephemeralPublicKey, ...rest } = validPayload;
    expect(validateSend(rest)).toBe(false);
  });

  it("rejects an unexpected property", () => {
    expect(
      validateSend({
        ...validPayload,
        plaintext: "attempt to leak plaintext",
      }),
    ).toBe(false);

    expect(
      validateSend({
        ...validPayload,
        senderId: "attacker-user-id",
      }),
    ).toBe(false);
  });
});

describe("conversationSchema", () => {
  it("accepts a valid userId param", () => {
    expect(validateConversationParams({ userId: "clh1234567890" })).toBe(true);
  });

  it("rejects when userId is missing", () => {
    expect(validateConversationParams({})).toBe(false);
  });

  it("accepts default pagination (empty query)", () => {
    expect(validateConversationQuery({})).toBe(true);
  });

  it("rejects when limit exceeds max", () => {
    expect(validateConversationQuery({ limit: 500 })).toBe(false);
  });

  it("rejects when page is zero or negative", () => {
    expect(validateConversationQuery({ page: 0 })).toBe(false);
  });
});
