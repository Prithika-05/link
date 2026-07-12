// src/utils/constants.js

export const USER_STATUS = Object.freeze({
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
});

export const MESSAGE_STATUS = Object.freeze({
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED',
});

export const MESSAGE_TYPE = Object.freeze({
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  FILE: 'FILE',
  SYSTEM: 'SYSTEM',
});

export const TOKEN_TYPE = Object.freeze({
  ACCESS: 'ACCESS',
  REFRESH: 'REFRESH',
});

export const AUDIT_ACTION = Object.freeze({
  REGISTER: 'REGISTER',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',

  PROFILE_UPDATED: 'PROFILE_UPDATED',

  MESSAGE_SENT: 'MESSAGE_SENT',

  PUBLIC_KEY_CREATED: 'PUBLIC_KEY_CREATED',
  PUBLIC_KEY_UPDATED: 'PUBLIC_KEY_UPDATED',
  PUBLIC_KEY_DELETED: 'PUBLIC_KEY_DELETED',
});

export const SECURITY_EVENT = Object.freeze({
  FAILED_LOGIN: 'FAILED_LOGIN',

  INVALID_JWT: 'INVALID_JWT',
  INVALID_REFRESH_TOKEN: 'INVALID_REFRESH_TOKEN',

  REPLAY_ATTACK: 'REPLAY_ATTACK',

  KEY_CHANGED: 'KEY_CHANGED',

  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  SOCKET_AUTH_FAILED: 'SOCKET_AUTH_FAILED',

  MULTIPLE_FAILED_LOGINS: 'MULTIPLE_FAILED_LOGINS',
});

export const SECURITY_SEVERITY = Object.freeze({
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL',
});

export const CRYPTO_ALGORITHM = Object.freeze({
  ECDH: 'ECDH',
  AES_GCM: 'AES-256-GCM',
  SHA256: 'SHA-256',
});

export const KEY_ALGORITHM = Object.freeze({
  ECDH_P256: 'ECDH-P256',
});

export const SOCKET_STATUS = Object.freeze({
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
});

export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
});

export const REDIS_PREFIX = Object.freeze({
  JWT_BLACKLIST: 'jwt:blacklist:',
  REFRESH_TOKEN: 'refresh:',
  PRESENCE: 'presence:',
  REPLAY: 'replay:',
});

export const HTTP_HEADER = Object.freeze({
  AUTHORIZATION: 'authorization',
  USER_AGENT: 'user-agent',
});