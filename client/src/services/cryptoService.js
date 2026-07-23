const DB_NAME = 'linkchat-crypto'
const DB_VERSION = 1
const STORE_NAME = 'keyPairs'
const ALGORITHM = 'ECDH-P256'
const CURVE = 'P-256'
const AUTH_TAG_BYTES = 16

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION)

        request.onupgradeneeded = () => {
            const database = request.result
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, {keyPath: 'userId'})
            }
        }

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

async function runStore(mode, operation) {
    const database = await openDatabase()

    return new Promise((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, mode)
        const store = transaction.objectStore(STORE_NAME)
        const request = operation(store)

        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
        transaction.oncomplete = () => database.close()
        transaction.onerror = () => reject(transaction.error)
    })
}

function bytesToBase64(bytes) {
    let binary = ''
    for (let index = 0; index < bytes.length; index += 1) {
        binary += String.fromCharCode(bytes[index])
    }
    return window.btoa(binary)
}

function base64ToBytes(value) {
    const binary = window.atob(value)
    return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function parsePublicKey(serializedKey) {
    try {
        return JSON.parse(serializedKey)
    } catch {
        try {
            return JSON.parse(new TextDecoder().decode(base64ToBytes(serializedKey)))
        } catch {
            throw new Error('The public key format is not supported by this frontend.')
        }
    }
}

async function fingerprintPublicKey(serializedKey) {
    const digest = await window.crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(serializedKey),
    )

    return Array.from(new Uint8Array(digest), (byte) =>
        byte.toString(16).padStart(2, '0'),
    ).join('')
}

async function importPublicKey(serializedKey) {
    return window.crypto.subtle.importKey(
        'jwk',
        parsePublicKey(serializedKey),
        {name: 'ECDH', namedCurve: CURVE},
        false,
        [],
    )
}

async function deriveAesKey(privateKey, publicKey) {
    const sharedSecret = await window.crypto.subtle.deriveBits(
        {name: 'ECDH', public: publicKey},
        privateKey,
        256,
    )

    return window.crypto.subtle.importKey(
        'raw',
        sharedSecret,
        {name: 'AES-GCM'},
        false,
        ['encrypt', 'decrypt'],
    )
}

function buildAdditionalData(senderId, receiverId) {
    return new TextEncoder().encode(`linkchat-v1:${senderId}:${receiverId}`)
}

export async function createKeyPairMaterial(userId) {
    if (!window.crypto?.subtle || !window.indexedDB) {
        throw new Error('This browser does not support the required Web Crypto APIs.')
    }

    const generatedPair = await window.crypto.subtle.generateKey(
        {name: 'ECDH', namedCurve: CURVE},
        true,
        ['deriveBits'],
    )

    const publicJwk = await window.crypto.subtle.exportKey(
        'jwk',
        generatedPair.publicKey,
    )
    const privateJwk = await window.crypto.subtle.exportKey(
        'jwk',
        generatedPair.privateKey,
    )
    const privateKey = await window.crypto.subtle.importKey(
        'jwk',
        privateJwk,
        {name: 'ECDH', namedCurve: CURVE},
        false,
        ['deriveBits'],
    )
    const serializedPublicKey = JSON.stringify(publicJwk)
    const fingerprint = await fingerprintPublicKey(serializedPublicKey)

    const record = {
        userId,
        algorithm: ALGORITHM,
        privateKey,
        publicKey: serializedPublicKey,
        fingerprint,
        createdAt: new Date().toISOString(),
    }

    return record
}

export async function storeKeyPair(record) {
    await runStore('readwrite', (store) => store.put(record))
    return record
}

export async function generateAndStoreKeyPair(userId) {
    const record = await createKeyPairMaterial(userId)
    return storeKeyPair(record)
}

export async function getStoredKeyPair(userId) {
    return runStore('readonly', (store) => store.get(userId))
}

export async function hasStoredKeyPair(userId) {
    return Boolean(await getStoredKeyPair(userId))
}

export async function removeStoredKeyPair(userId) {
    return runStore('readwrite', (store) => store.delete(userId))
}

export async function encryptMessage({
                                         senderId,
                                         receiverId,
                                         receiverPublicKey,
                                         plaintext,
                                     }) {
    const ownKeyPair = await getStoredKeyPair(senderId)
    if (!ownKeyPair?.privateKey) {
        throw new Error('Your private key is missing on this device.')
    }

    const recipientKey = await importPublicKey(receiverPublicKey)
    const aesKey = await deriveAesKey(ownKeyPair.privateKey, recipientKey)
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv,
            additionalData: buildAdditionalData(senderId, receiverId),
            tagLength: 128,
        },
        aesKey,
        new TextEncoder().encode(plaintext),
    )

    const encryptedBytes = new Uint8Array(encryptedBuffer)
    const ciphertext = encryptedBytes.slice(0, -AUTH_TAG_BYTES)
    const authTag = encryptedBytes.slice(-AUTH_TAG_BYTES)

    return {
        ciphertext: bytesToBase64(ciphertext),
        iv: bytesToBase64(iv),
        authTag: bytesToBase64(authTag),
        // The backend contract names this field ephemeralPublicKey. Its current
        // schema has no sender-encrypted copy, so the sender's persistent public
        // key is used to keep sent history decryptable on reload.
        ephemeralPublicKey: ownKeyPair.publicKey,
    }
}

export async function decryptMessage({
                                         currentUserId,
                                         counterpartyPublicKey,
                                         message,
                                     }) {
    const ownKeyPair = await getStoredKeyPair(currentUserId)
    if (!ownKeyPair?.privateKey) {
        throw new Error('Your private key is missing on this device.')
    }

    const otherPublicKey = await importPublicKey(counterpartyPublicKey)
    const aesKey = await deriveAesKey(ownKeyPair.privateKey, otherPublicKey)
    const ciphertext = base64ToBytes(message.ciphertext)
    const authTag = base64ToBytes(message.authTag)
    const combined = new Uint8Array(ciphertext.length + authTag.length)
    combined.set(ciphertext)
    combined.set(authTag, ciphertext.length)

    const decrypted = await window.crypto.subtle.decrypt(
        {
            name: 'AES-GCM',
            iv: base64ToBytes(message.iv),
            additionalData: buildAdditionalData(message.senderId, message.receiverId),
            tagLength: 128,
        },
        aesKey,
        combined,
    )

    return new TextDecoder().decode(decrypted)
}

export function formatFingerprint(fingerprint, groups = 8) {
    if (!fingerprint) return 'Not available'
    return fingerprint
        .toUpperCase()
        .match(new RegExp(`.{1,${groups}}`, 'g'))
        ?.join(' ')
}

export const cryptoMetadata = Object.freeze({
    algorithm: ALGORITHM,
})
