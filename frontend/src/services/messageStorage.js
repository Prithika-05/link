const DB_NAME = "linkchat-messages";
const DB_VERSION = 1;
const STORE_NAME = "local_messages";

function openMessageDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("by_contact", "contactId", { unique: false });
        store.createIndex("by_user_contact", ["userId", "contactId"], {
          unique: false,
        });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalMessage(userId, contactId, message) {
  const db = await openMessageDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const record = { ...message, userId, contactId };
    const request = store.put(record);

    request.onsuccess = () => resolve(record);
    request.onerror = () => reject(request.error);
  });
}

export async function getLocalMessagesForContact(userId, contactId) {
  const db = await openMessageDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index("by_user_contact");
    const request = index.getAll([userId, contactId]);

    request.onsuccess = () => {
      const messages = request.result || [];
      messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      resolve(messages);
    };
    request.onerror = () => reject(request.error);
  });
}
