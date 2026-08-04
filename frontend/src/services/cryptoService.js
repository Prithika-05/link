const DB_NAME = "linkchat-crypto";
const DB_VERSION = 2;
const STORE_NAME = "keyPairs";
const ALGORITHM = "ECDH-P256";
const CURVE = "P-256";
const AUTH_TAG_BYTES = 16;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: "publicId" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function runStore(mode, operation) {
  const database = await openDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = operation(store);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error);
  });
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }
  return window.btoa(binary);
}

function base64ToBytes(value) {
  const binary = window.atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function parsePublicKey(serializedKey) {
  try {
    return JSON.parse(serializedKey);
  } catch (error) {
    try {
      return JSON.parse(new TextDecoder().decode(base64ToBytes(serializedKey)));
    } catch {
      throw new Error("The public key format is not supported.");
    }
  }
}

export async function fingerprintPublicKey(serializedKey) {
  const digest = await window.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(serializedKey),
  );

  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

async function importPublicKey(serializedKey) {
  return window.crypto.subtle.importKey(
    "jwk",
    parsePublicKey(serializedKey),
    { name: "ECDH", namedCurve: CURVE },
    false,
    [],
  );
}

/**
 * Standard ECDH AES Key Derivation
 */
async function deriveAesKey(privateKey, publicKey) {
  const sharedSecret = await window.crypto.subtle.deriveBits(
    { name: "ECDH", public: publicKey },
    privateKey,
    256,
  );

  return window.crypto.subtle.importKey(
    "raw",
    sharedSecret,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

function buildAdditionalData(senderId, receiverId) {
  return new TextEncoder().encode(`linkchat-v1:${senderId}:${receiverId}`);
}

export async function createKeyPairMaterial(publicId) {
  if (!window.crypto?.subtle || !window.indexedDB) {
    throw new Error("This browser does not support Web Crypto APIs.");
  }

  const generatedPair = await window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: CURVE },
    true,
    ["deriveBits"],
  );

  const publicJwk = await window.crypto.subtle.exportKey(
    "jwk",
    generatedPair.publicKey,
  );

  const privateJwk = await window.crypto.subtle.exportKey(
    "jwk",
    generatedPair.privateKey,
  );

  const privateKey = await window.crypto.subtle.importKey(
    "jwk",
    privateJwk,
    { name: "ECDH", namedCurve: CURVE },
    false,
    ["deriveBits"],
  );

  const serializedPublicKey = JSON.stringify(publicJwk);
  const fingerprint = await fingerprintPublicKey(serializedPublicKey);

  return {
    publicId,
    algorithm: ALGORITHM,
    privateKey,
    privateKeyJwk: privateJwk,
    publicKey: serializedPublicKey,
    fingerprint,
    createdAt: new Date().toISOString(),
  };
}

export async function storeKeyPair(record) {
  await runStore("readwrite", (store) => store.put(record));
  return record;
}

export async function generateAndStoreKeyPair(publicId) {
  const record = await createKeyPairMaterial(publicId);
  return storeKeyPair(record);
}

export async function getStoredKeyPair(publicId) {
  return runStore("readonly", (store) => store.get(publicId));
}

export async function hasStoredKeyPair(publicId) {
  return Boolean(await getStoredKeyPair(publicId));
}

export async function removeStoredKeyPair(publicId) {
  return runStore("readwrite", (store) => store.delete(publicId));
}

/**
 * ENCRYPT: Uses a fresh EPHEMERAL ECDH key pair per message (Forward Secrecy)
 */
export async function encryptMessage({
  senderPublicId,
  receiverPublicId,
  receiverPublicKey,
  plaintext,
}) {
  // 1. Generate a single-use ephemeral key pair for this outgoing message
  const ephemeralPair = await window.crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: CURVE },
    true,
    ["deriveBits"],
  );

  const recipientKey = await importPublicKey(receiverPublicKey);

  // 2. Derive AES key using ephemeral private key + recipient static public key
  const aesKey = await deriveAesKey(ephemeralPair.privateKey, recipientKey);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
      additionalData: buildAdditionalData(senderPublicId, receiverPublicId),
      tagLength: 128,
    },
    aesKey,
    new TextEncoder().encode(plaintext),
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);
  const ciphertext = encryptedBytes.slice(0, -AUTH_TAG_BYTES);
  const authTag = encryptedBytes.slice(-AUTH_TAG_BYTES);

  // 3. Export ephemeral public key to transmit with payload
  const ephemeralPublicJwk = await window.crypto.subtle.exportKey(
    "jwk",
    ephemeralPair.publicKey,
  );

  return {
    ciphertext: bytesToBase64(ciphertext),
    iv: bytesToBase64(iv),
    authTag: bytesToBase64(authTag),
    ephemeralPublicKey: JSON.stringify(ephemeralPublicJwk), // Single-use key sent to recipient
  };
}

/**
 * DECRYPT: Ephemeral-Static ECDH for incoming messages
 */
export async function decryptMessage({
  currentUserPublicId,
  counterpartyPublicKey,
  message,
}) {
  const ownKeyPair = await getStoredKeyPair(currentUserPublicId);
  if (!ownKeyPair?.privateKey) {
    throw new Error("Your private key is missing on this device.");
  }

  // Use ephemeral key attached to incoming message, or fallback to static key
  const publicKeyToImport = message.ephemeralPublicKey || counterpartyPublicKey;
  const importedKey = await importPublicKey(publicKeyToImport);
  const aesKey = await deriveAesKey(ownKeyPair.privateKey, importedKey);

  const ciphertext = base64ToBytes(message.ciphertext);
  const authTag = base64ToBytes(message.authTag);

  const combined = new Uint8Array(ciphertext.length + authTag.length);
  combined.set(ciphertext);
  combined.set(authTag, ciphertext.length);

  try {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: base64ToBytes(message.iv),
        additionalData: buildAdditionalData(
          message.senderPublicId,
          message.receiverPublicId,
        ),
        tagLength: 128,
      },
      aesKey,
      combined,
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error("Decryption failed for message:", message.id, err);
    throw new Error("Unable to decrypt this message.");
  }
}

export function formatFingerprint(fingerprint, groups = 8) {
  if (!fingerprint) return "Not available";
  return fingerprint
    .toUpperCase()
    .match(new RegExp(`.{1,${groups}}`, "g"))
    ?.join(" ");
}

export function generateRecoveryKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
  const chunks = hex.match(/.{1,4}/g);
  return `LKCH-${chunks.join("-")}`;
}

/**
 * High-iteration PBKDF2 Key Derivation (600,000 rounds per OWASP guidelines)
 */
async function deriveBackupKey(recoveryKey, salt) {
  const encoder = new TextEncoder();
  const normalizedKey = recoveryKey.trim().replace(/[\s-]/g, "").toUpperCase();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(normalizedKey),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 600000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptPrivateKeyWithRecoveryKey(
  privateKeyJwk,
  recoveryKey,
) {
  if (!privateKeyJwk) {
    throw new Error("Cannot backup private key: JWK material is missing.");
  }

  const salt = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await deriveBackupKey(recoveryKey, salt);

  const jsonString = JSON.stringify(privateKeyJwk);
  const plaintextData = new TextEncoder().encode(jsonString);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, tagLength: 128 },
    aesKey,
    plaintextData,
  );

  const encryptedBytes = new Uint8Array(ciphertextBuffer);

  return {
    encryptedPrivateKey: bytesToBase64(encryptedBytes),
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
  };
}

export async function decryptPrivateKeyWithRecoveryKey(
  backupData,
  recoveryKey,
) {
  const { encryptedPrivateKey, salt, iv } = backupData;

  if (!encryptedPrivateKey || !salt || !iv) {
    throw new Error("Backup data on the server is incomplete.");
  }

  const saltBytes = base64ToBytes(salt);
  const ivBytes = base64ToBytes(iv);
  const ciphertextBytes = base64ToBytes(encryptedPrivateKey);

  const aesKey = await deriveBackupKey(recoveryKey, saltBytes);

  let decryptedBuffer;
  try {
    decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBytes, tagLength: 128 },
      aesKey,
      ciphertextBytes,
    );
  } catch (err) {
    console.error("Crypto Decryption Failed:", err);
    throw new Error("Invalid Recovery Key phrase.");
  }

  const jsonString = new TextDecoder().decode(decryptedBuffer);
  return JSON.parse(jsonString);
}

export const cryptoMetadata = Object.freeze({
  algorithm: ALGORITHM,
});
