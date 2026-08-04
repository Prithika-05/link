import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import Icon from "../components/common/Icon";
import { Alert, Button } from "../components/common/UI";
import AuthLayout from "../layouts/AuthLayout";
import {
  createKeyPairMaterial,
  formatFingerprint,
  getStoredKeyPair,
  storeKeyPair,
  generateRecoveryKey,
  encryptPrivateKeyWithRecoveryKey,
  decryptPrivateKeyWithRecoveryKey,
} from "../services/cryptoService";
import { keyService } from "../services/keyService";

export default function KeySetupPage() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [fingerprint, setFingerprint] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [inputRecoveryKey, setInputRecoveryKey] = useState("");
  const [backupExists, setBackupExists] = useState(false);
  const [backupData, setBackupData] = useState(null);

  const [mode, setMode] = useState("restore");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.publicId) return;

    getStoredKeyPair(user.publicId)
      .then((record) => {
        if (record?.fingerprint) {
          setFingerprint(record.fingerprint);
        }
      })
      .catch(() => setFingerprint(""));

    keyService
      .getKeyBackup()
      .then((data) => {
        if (data && data.encryptedPrivateKey) {
          setBackupExists(true);
          setBackupData(data);
          setMode("restore");
        } else {
          setBackupExists(false);
          setMode("create");
        }
      })
      .catch(() => {
        setBackupExists(false);
        setMode("create");
      });
  }, [user?.publicId]);

  const handleRestoreKeys = async (e) => {
    e.preventDefault();
    if (!inputRecoveryKey.trim()) {
      setError("Please enter your Recovery Key.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      if (!backupData) {
        throw new Error("No key backup found on server.");
      }

      const privateKeyJwk = await decryptPrivateKeyWithRecoveryKey(
        backupData,
        inputRecoveryKey.trim(),
      );

      const privateKey = await window.crypto.subtle.importKey(
        "jwk",
        privateKeyJwk,
        { name: "ECDH", namedCurve: "P-256" },
        false,
        ["deriveBits"],
      );

      const serverKeyData = await keyService.getPublicKey(user.publicId);

      const restoredRecord = {
        publicId: user.publicId,
        algorithm: "ECDH-P256",
        privateKey,
        publicKey: serverKeyData.key || serverKeyData.publicKey,
        fingerprint: backupData.fingerprint || serverKeyData.fingerprint,
        createdAt: new Date().toISOString(),
      };

      await storeKeyPair(restoredRecord);
      setFingerprint(restoredRecord.fingerprint);

      navigate("/dashboard");
    } catch (restoreError) {
      console.error(restoreError);
      setError(
        "Invalid Recovery Key. Please double check your phrase and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const createKeys = async () => {
    if (backupExists || fingerprint) {
      const confirmed = window.confirm(
        "WARNING: Generating a new key without your old Recovery Key will make previous messages permanently unreadable. Continue?",
      );
      if (!confirmed) return;
    }

    setBusy(true);
    setError("");
    setCopied(false);

    try {
      if (!user?.publicId) {
        throw new Error("User publicId is missing.");
      }

      const material = await createKeyPairMaterial(user.publicId);
      const generatedRecoveryKey = generateRecoveryKey();

      const backupPayload = await encryptPrivateKeyWithRecoveryKey(
        material.privateKeyJwk,
        generatedRecoveryKey,
      );

      await Promise.all([
        keyService.uploadPublicKey({
          algorithm: material.algorithm,
          key: material.publicKey,
          fingerprint: material.fingerprint,
        }),
        keyService.uploadKeyBackup({
          ...backupPayload,
          fingerprint: material.fingerprint,
        }),
      ]);

      await storeKeyPair(material);

      setFingerprint(material.fingerprint);
      setRecoveryKey(generatedRecoveryKey);
      setBackupExists(true);
    } catch (setupError) {
      setError(setupError.message || "Key setup failed.");
    } finally {
      setBusy(false);
    }
  };

  const copyRecoveryKey = async () => {
    if (!recoveryKey) return;
    await navigator.clipboard.writeText(recoveryKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const downloadRecoveryKeyTxt = () => {
    if (!recoveryKey) return;
    const fileContent = `====================================================\nLINKCHAT - EMERGENCY RECOVERY KEY\n====================================================\nUser ID     : ${user?.publicId || "N/A"}\nUsername    : ${user?.username || "N/A"}\nRecovery Key: ${recoveryKey}\n\nKEEP THIS FILE SAFE! If you lose this key, your encrypted chat history CANNOT be recovered.\n====================================================`;

    const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `linkchat-recovery-key-${user?.username || "account"}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFinishSetup = () => {
    // Automatically trigger file download if user just created a new key
    if (recoveryKey) {
      downloadRecoveryKeyTxt();
    }
    navigate("/dashboard");
  };

  return (
    <AuthLayout aside={false}>
      <div className="setup-page max-w-md mx-auto p-4">
        <div className="setup-progress flex justify-center gap-2 mb-4">
          <span className="done">1</span>
          <i />
          <span className="current">2</span>
          <i />
          <span className={fingerprint ? "done" : ""}>3</span>
        </div>

        <div className="setup-icon text-center mb-2">
          <Icon name={fingerprint ? "check" : "key"} size={35} />
        </div>

        <div className="auth-heading centered text-center mb-6">
          <span className="eyebrow text-xs font-bold tracking-wider text-muted">
            SECURITY SETUP
          </span>
          <h1 className="text-2xl font-bold">
            {fingerprint
              ? "Your Security Key is Ready"
              : backupExists && mode === "restore"
                ? "Restore Your Encryption Key"
                : "Set Up Your Encryption Key"}
          </h1>
          <p className="text-sm text-muted mt-1">
            {fingerprint
              ? "Your ECDH keypair is active. Save your Recovery Key before proceeding."
              : backupExists && mode === "restore"
                ? "Enter your Recovery Key to unlock your encrypted messages on this device."
                : "LinkChat needs an ECDH P-256 key pair to encrypt and decrypt messages."}
          </p>
        </div>

        {error && <Alert className="mb-4">{error}</Alert>}

        {!fingerprint && backupExists && (
          <div className="flex bg-surface-hover rounded-lg p-1 mb-6 border border-border">
            <button
              type="button"
              onClick={() => {
                setMode("restore");
                setError("");
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                mode === "restore"
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Restore Existing Key
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("create");
                setError("");
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                mode === "create"
                  ? "bg-amber-600 text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              Lost Key? Reset
            </button>
          </div>
        )}

        {/* RESTORE FORM */}
        {!fingerprint && mode === "restore" && backupExists && (
          <form onSubmit={handleRestoreKeys} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted block text-left">
                ENTER YOUR RECOVERY KEY
              </label>
              <input
                type="text"
                placeholder="LKCH-XXXX-XXXX-XXXX-XXXX-XXXX"
                value={inputRecoveryKey}
                onChange={(e) => setInputRecoveryKey(e.target.value)}
                className="w-full p-3 font-mono tracking-wider text-center text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={busy}
              />
            </div>
            <Button type="submit" icon="key" loading={busy} className="w-full">
              Restore Key & Unlock Chats
            </Button>
          </form>
        )}

        {/* CREATE KEY VIEW */}
        {!fingerprint && (mode === "create" || !backupExists) && (
          <div className="space-y-4">
            <Button
              onClick={createKeys}
              icon="key"
              loading={busy}
              className="w-full"
              variant={backupExists ? "secondary" : "primary"}
            >
              Generate Key & Recovery Phrase
            </Button>
          </div>
        )}

        {/* DISPLAY GENERATED RECOVERY KEY & WARNING */}
        {fingerprint && (
          <div className="key-ready space-y-4 mt-4">
            <div className="fingerprint-box p-3 bg-surface rounded-lg border border-border text-center">
              <span className="text-xs text-muted block mb-1">
                Your Public Fingerprint
              </span>
              <code className="font-mono text-sm font-bold tracking-wider">
                {formatFingerprint(fingerprint)}
              </code>
            </div>

            {recoveryKey && (
              <div className="recovery-box p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                  <Icon name="shield" size={18} />
                  <span>IMPORTANT: SAVE YOUR RECOVERY KEY</span>
                </div>

                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-600 dark:text-red-400 font-medium leading-relaxed">
                  ⚠️ <strong>CRITICAL WARNING:</strong> Copy and store this key
                  in a secure location! If you log in on a new device or clear
                  browser cache,{" "}
                  <strong>
                    this key is required to read your chat history
                  </strong>
                  . If lost, your old messages can NEVER be recovered.
                </div>

                <div className="p-3 bg-black/10 dark:bg-black/40 rounded-lg text-center font-mono tracking-widest text-lg font-bold select-all text-amber-600 dark:text-amber-300">
                  {recoveryKey}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyRecoveryKey}
                    className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-surface border border-border hover:bg-surface-hover flex items-center justify-center gap-2 transition-colors"
                  >
                    <Icon name={copied ? "check" : "copy"} size={15} />
                    {copied ? "Copied to Clipboard" : "Copy Key"}
                  </button>

                  <button
                    type="button"
                    onClick={downloadRecoveryKeyTxt}
                    className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-surface border border-border hover:bg-surface-hover flex items-center justify-center gap-2 transition-colors"
                  >
                    <Icon name="download" size={15} />
                    Download .txt
                  </button>
                </div>
              </div>
            )}

            <Button
              onClick={handleFinishSetup}
              iconRight="arrowRight"
              className="w-full mt-4"
            >
              Continue to LinkChat
            </Button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
