import React, { useState } from "react";
import Icon from "./Icon";
import { Alert, Button, Modal } from "./UI";
import { keyService } from "../../services/keyService";
import {
  decryptPrivateKeyWithRecoveryKey,
  storeKeyPair,
} from "../../services/cryptoService";

export default function RestoreKeyModal({ isOpen, onSuccess, onResetNewKey }) {
  const [recoveryKey, setRecoveryKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleRestore = async (e) => {
    e.preventDefault();
    const cleanKey = recoveryKey.trim();

    if (!cleanKey) {
      setError("Please enter your 24-character Recovery Key.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Fetch encrypted private key backup from server
      const backupData = await keyService.getKeyBackup();

      if (!backupData?.encryptedPrivateKey) {
        throw new Error("No key backup found on server for this account.");
      }

      // 2. Decrypt the private key JWK using the recovery phrase
      const privateKeyJwk = await decryptPrivateKeyWithRecoveryKey(
        backupData,
        cleanKey,
      );

      // 3. Import and re-store in local IndexedDB
      const importedPrivateKey = await crypto.subtle.importKey(
        "jwk",
        privateKeyJwk,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        ["deriveKey", "deriveBits"],
      );

      // We also need the public key to store the complete keypair locally
      const publicKeyData = await keyService.getPublicKey("me"); // or current user publicId

      await storeKeyPair({
        privateKey: importedPrivateKey,
        publicKey: publicKeyData.key,
        fingerprint: backupData.fingerprint || publicKeyData.fingerprint,
      });

      onSuccess();
    } catch (err) {
      console.error("Key restoration failed:", err);
      setError(
        "Invalid Recovery Key or decryption failed. Double check your phrase and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Restore Your Encrypted Chat Session" onClose={() => {}}>
      <div className="space-y-4 p-2">
        <div className="flex items-center gap-3 rounded-lg bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
          <Icon name="shield" size={24} />
          <p className="text-sm">
            Your browser storage is missing the private key required to decrypt
            your messages. Enter your <strong>24-character Recovery Key</strong>{" "}
            to restore your history.
          </p>
        </div>

        {error && <Alert>{error}</Alert>}

        <form onSubmit={handleRestore} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted mb-1">
              Recovery Key
            </label>
            <input
              type="text"
              placeholder="LKCH-XXXX-XXXX-XXXX-XXXX-XXXX"
              className="w-full rounded-md border border-gray-300 p-2 text-sm tracking-widest font-mono uppercase dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              value={recoveryKey}
              onChange={(e) => setRecoveryKey(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              className="text-xs text-muted hover:underline"
              onClick={onResetNewKey}
            >
              Lost Recovery Key? Generate New Keys
            </button>

            <Button type="submit" disabled={loading}>
              {loading ? "Decrypting Key…" : "Restore Session"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
