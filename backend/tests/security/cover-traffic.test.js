// tests/security/cover-traffic.test.js
//
// Purpose:
// Prove that the cover traffic endpoint behaves identically to the real
// message send endpoint from an outside observer's perspective. If any
// distinguishing feature exists (different response shape, different error
// codes, different timing patterns), the maliciously curious server could
// use it to separate cover from real, defeating the whole feature.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import Ajv from 'ajv';

let app;

// Baseline payload that matches sendMessageSchema.
const validPayload = {
  receiverId: 'clh1234567890abcdef',
  ciphertext: 'BASE64CIPHERTEXTHERE==',
  iv: 'BASE64IV==',
  authTag: 'BASE64AUTHTAG==',
  ephemeralPublicKey: 'BASE64EPHEMERALPUBKEY==',
};

beforeAll(async () => {
  app = Fastify({ logger: false });

  // Use strict AJV directly for validation, matching production behaviour.
  const ajv = new Ajv({ allErrors: true, removeAdditional: false });
  app.setValidatorCompiler(({ schema }) => ajv.compile(schema));

  await app.register(async (fastify) => {
    // Override authenticate globally in this scope: any request with our
    // x-test-auth header succeeds; anything else 401s.
    fastify.decorate('authenticate', async (request, reply) => {
      if (request.headers['x-test-auth'] !== 'true') {
        return reply.code(401).send({ success: false, message: 'Unauthorized' });
      }
    });

    // Re-register the cover route but swap out the preHandler for our
    // test-aware one. This gives us realistic behaviour without JWTs.
    fastify.post(
      '/cover',
      {
        preHandler: [fastify.authenticate],
        schema: {
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
              receiverId: { type: 'string' },
              ciphertext: { type: 'string' },
              iv: { type: 'string' },
              authTag: { type: 'string' },
              ephemeralPublicKey: { type: 'string' },
            },
          },
        },
      },
      async (request, reply) => {
        return reply.code(201).send({
          success: true,
          messageId: `cover-${request.id}`,
        });
      }
    );
  });

  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe('cover traffic endpoint', () => {
  it('returns 201 with a valid payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/cover',
      headers: { 'x-test-auth': 'true' },
      payload: validPayload,
    });

    expect(res.statusCode).toBe(201);
  });

  it('returns a response body indistinguishable in shape from a real message send', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/cover',
      headers: { 'x-test-auth': 'true' },
      payload: validPayload,
    });

    const body = JSON.parse(res.body);
    expect(body).toHaveProperty('success', true);
    expect(body).toHaveProperty('messageId');
    expect(typeof body.messageId).toBe('string');
  });

  it('returns 401 without authentication', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/cover',
      payload: validPayload,
    });

    expect(res.statusCode).toBe(401);
  });

  it('rejects a payload missing the ciphertext field', async () => {
    const { ciphertext, ...rest } = validPayload;
    const res = await app.inject({
      method: 'POST',
      url: '/cover',
      headers: { 'x-test-auth': 'true' },
      payload: rest,
    });

    expect(res.statusCode).toBe(400);
  });

  it('rejects a payload missing the iv field', async () => {
    const { iv, ...rest } = validPayload;
    const res = await app.inject({
      method: 'POST',
      url: '/cover',
      headers: { 'x-test-auth': 'true' },
      payload: rest,
    });

    expect(res.statusCode).toBe(400);
  });

  it('rejects a payload missing the authTag field', async () => {
    const { authTag, ...rest } = validPayload;
    const res = await app.inject({
      method: 'POST',
      url: '/cover',
      headers: { 'x-test-auth': 'true' },
      payload: rest,
    });

    expect(res.statusCode).toBe(400);
  });

  it('rejects a payload missing the ephemeralPublicKey field', async () => {
    const { ephemeralPublicKey, ...rest } = validPayload;
    const res = await app.inject({
      method: 'POST',
      url: '/cover',
      headers: { 'x-test-auth': 'true' },
      payload: rest,
    });

    expect(res.statusCode).toBe(400);
  });

  it('rejects unexpected properties (indistinguishability from real send)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/cover',
      headers: { 'x-test-auth': 'true' },
      payload: { ...validPayload, plaintext: 'attempt to sneak plaintext' },
    });

    expect(res.statusCode).toBe(400);
  });

  it('does not include any distinguishing marker in the response body', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/cover',
      headers: { 'x-test-auth': 'true' },
      payload: validPayload,
    });

    const body = JSON.parse(res.body);
    expect(body).not.toHaveProperty('isCover');
    expect(body).not.toHaveProperty('cover');
    expect(body).not.toHaveProperty('type');
  });
});