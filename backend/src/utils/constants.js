// src/utils/constants.js

/**
 * --------------------------------------------------------------------------
 * User
 * --------------------------------------------------------------------------
 */

export const USER_STATUS = Object.freeze({
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  AWAY: 'AWAY',
});

/**
 * --------------------------------------------------------------------------
 * Message
 * --------------------------------------------------------------------------
 */

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

/**
 * --------------------------------------------------------------------------
 * JWT
 * --------------------------------------------------------------------------
 */

export const TOKEN_TYPE = Object.freeze({
  ACCESS: 'ACCESS',
  REFRESH: 'REFRESH',
});

/**
 * --------------------------------------------------------------------------
 * Audit Log
 * --------------------------------------------------------------------------
 */

export const AUDIT_ACTION = Object.freeze({
  REGISTER: 'REGISTER',

  LOGIN: 'LOGIN',

  TOKEN_REFRESH: 'TOKEN_REFRESH',

  LOGOUT: 'LOGOUT',

  PROFILE_UPDATED: 'PROFILE_UPDATED',

  PASSWORD_CHANGED: 'PASSWORD_CHANGED',

  MESSAGE_SENT: 'MESSAGE_SENT',

  MESSAGE_READ: 'MESSAGE_READ',

  PUBLIC_KEY_CREATED: 'PUBLIC_KEY_CREATED',

  PUBLIC_KEY_UPDATED: 'PUBLIC_KEY_UPDATED',

  PUBLIC_KEY_DELETED: 'PUBLIC_KEY_DELETED',

  SESSION_REVOKED: 'SESSION_REVOKED',

  ALL_SESSIONS_REVOKED:
    'ALL_SESSIONS_REVOKED',
});

/**
 * --------------------------------------------------------------------------
 * Security Events
 * --------------------------------------------------------------------------
 */

export const SECURITY_EVENT = Object.freeze({
  FAILED_LOGIN: 'FAILED_LOGIN',

  INVALID_JWT: 'INVALID_JWT',

  INVALID_REFRESH_TOKEN:
    'INVALID_REFRESH_TOKEN',

  TOKEN_REUSE: 'TOKEN_REUSE',

  REPLAY_ATTACK: 'REPLAY_ATTACK',

  KEY_CHANGED: 'KEY_CHANGED',

  RATE_LIMIT_EXCEEDED:
    'RATE_LIMIT_EXCEEDED',

  SOCKET_AUTH_FAILED:
    'SOCKET_AUTH_FAILED',

  MULTIPLE_FAILED_LOGINS:
    'MULTIPLE_FAILED_LOGINS',

  UNAUTHORIZED_ACCESS:
    'UNAUTHORIZED_ACCESS',

  SESSION_REVOKED:
    'SESSION_REVOKED',
});

/**
 * --------------------------------------------------------------------------
 * Security Severity
 * --------------------------------------------------------------------------
 */

export const SECURITY_SEVERITY =
  Object.freeze({
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    CRITICAL: 'CRITICAL',
  });

/**
 * --------------------------------------------------------------------------
 * Cryptography
 * --------------------------------------------------------------------------
 */

export const CRYPTO_ALGORITHM =
  Object.freeze({
    ECDH: 'ECDH',
    AES_GCM: 'AES-256-GCM',
    SHA256: 'SHA-256',
  });

export const KEY_ALGORITHM =
  Object.freeze({
    ECDH_P256: 'ECDH-P256',
  });

/**
 * --------------------------------------------------------------------------
 * Socket
 * --------------------------------------------------------------------------
 */

export const SOCKET_STATUS =
  Object.freeze({
    CONNECTED: 'CONNECTED',
    DISCONNECTED: 'DISCONNECTED',
  });

/**
 * --------------------------------------------------------------------------
 * Pagination
 * --------------------------------------------------------------------------
 */

export const PAGINATION =
  Object.freeze({
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 50,
    MAX_LIMIT: 100,
  });

/**
 * --------------------------------------------------------------------------
 * Redis Keys
 * --------------------------------------------------------------------------
 */

export const REDIS_PREFIX =
  Object.freeze({
    JWT_BLACKLIST: 'jwt:blacklist:',

    REFRESH_TOKEN: 'refresh:',

    PRESENCE: 'presence:',

    REPLAY: 'replay:',
  });

/**
 * --------------------------------------------------------------------------
 * HTTP Headers
 * --------------------------------------------------------------------------
 */

export const HTTP_HEADER =
  Object.freeze({
    AUTHORIZATION: 'authorization',

    USER_AGENT: 'user-agent',
  });