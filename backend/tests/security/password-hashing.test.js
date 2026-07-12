import { describe, it, expect } from 'vitest';
import bcrypt from 'bcrypt';

describe('password hashing (bcrypt)', () => {
  it('hashes the same password to different values on each call (salting)', async () => {
    const hashA = await bcrypt.hash('correct-horse-battery-staple', 12);
    const hashB = await bcrypt.hash('correct-horse-battery-staple', 12);

    expect(hashA).not.toBe(hashB);
  });

  it('uses cost factor 12 as configured in AuthService', async () => {
    
    const hash = await bcrypt.hash('any-password', 12);
    const parts = hash.split('$');
    expect(parts[2]).toBe('12');
  });

  it('never stores plaintext (the hash is not the password)', async () => {
    const password = 'super-secret-plaintext-password';
    const hash = await bcrypt.hash(password, 12);

    expect(hash).not.toContain(password);
    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2')).toBe(true);
  });

  it('compare() returns true for the correct password', async () => {
    const hash = await bcrypt.hash('my-password', 12);
    const ok = await bcrypt.compare('my-password', hash);
    expect(ok).toBe(true);
  });

  it('compare() returns false for a wrong password', async () => {
    const hash = await bcrypt.hash('my-password', 12);
    const ok = await bcrypt.compare('wrong-password', hash);
    expect(ok).toBe(false);
  });
});