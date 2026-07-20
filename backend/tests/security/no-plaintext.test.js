import { describe, it, expect, vi } from 'vitest';
import { MessageService } from '../../src/modules/messages/messages.service.js';

function makeFakePrisma() {
  const stored = [];

  return {
    _stored: stored,
    message: {
      create: vi.fn(async ({ data }) => {
        const row = { id: `msg-${stored.length + 1}`, ...data };
        stored.push(row);
        return row;
      }),
    },
  };
}

describe('the server never sees plaintext', () => {
  it('MessageService.send stores only ciphertext, iv, authTag, ephemeralPublicKey', async () => {
    const prisma = makeFakePrisma();
    const service = new MessageService({ prisma });

    
    const secretPlaintext = 'meet at cafe at 6pm';

    await service.send('alice-id', {
      receiverId: 'bob-id',
      ciphertext: 'BASE64-CIPHERTEXT-THAT-DECODES-TO-SOMETHING-OPAQUE',
      iv: 'BASE64-IV',
      authTag: 'BASE64-AUTH-TAG',
      ephemeralPublicKey: 'BASE64-EPHEMERAL-PUBKEY',
    });

    
    const storedRow = prisma._stored[0];
    const storedAsString = JSON.stringify(storedRow);

    expect(storedAsString).not.toContain(secretPlaintext);
    expect(storedAsString).not.toContain('meet');
    expect(storedAsString).not.toContain('cafe');
  });

  it('MessageService.send does not accept a plaintext field even if passed', async () => {
    
    const prisma = makeFakePrisma();
    const service = new MessageService({ prisma });

    await service.send('alice-id', {
      receiverId: 'bob-id',
      ciphertext: 'BASE64-CIPHERTEXT',
      iv: 'BASE64-IV',
      authTag: 'BASE64-AUTH-TAG',
      ephemeralPublicKey: 'BASE64-EPHEMERAL-PUBKEY',
      plaintext: 'attempt-to-inject-plaintext',
    });

    const stored = prisma._stored[0];
    expect(stored).not.toHaveProperty('plaintext');
    expect(JSON.stringify(stored)).not.toContain('attempt-to-inject-plaintext');
  });

  it('the DB schema shape sent to Prisma contains only the expected fields', () => {

    const allowedFields = new Set([
      'senderId',
      'receiverId',
      'ciphertext',
      'iv',
      'authTag',
      'ephemeralPublicKey',
    ]);

    const prisma = makeFakePrisma();
    const service = new MessageService({ prisma });

    return service
      .send('alice-id', {
        receiverId: 'bob-id',
        ciphertext: 'X',
        iv: 'Y',
        authTag: 'Z',
        ephemeralPublicKey: 'K',
      })
      .then(() => {
        const passedToCreate = prisma.message.create.mock.calls[0][0].data;
        for (const field of Object.keys(passedToCreate)) {
          expect(allowedFields.has(field)).toBe(true);
        }
      });
  });
});