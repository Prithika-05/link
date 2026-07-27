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
} from "../services/cryptoService";
import { keyService } from "../services/keyService";

export default function KeySetupPage() {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const [fingerprint, setFingerprint] = useState("");
  const [recoveryKey, setRecoveryKey] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.publicId) return;

    getStoredKeyPair(user.publicId)
      .then((record) => setFingerprint(record?.fingerprint || ""))
      .catch(() => setFingerprint(""));
  }, [user?.publicId]);

  const createKeys = async () => {
    if (fingerprint) {
      const confirmed = window.confirm(
        "Replacing this device key will make messages encrypted with the old key unreadable unless restored. Continue?",
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

      // 1. Generate local ECDH Key Pair & Material
      const material = await createKeyPairMaterial(user.publicId);

      // 2. Generate 24-character human-readable Recovery Key (e.g. LKCH-XXXX-...)
      const generatedRecoveryKey = generateRecoveryKey();

      // 3. Encrypt the Private Key JWK with the Recovery Key
      const backupPayload = await encryptPrivateKeyWithRecoveryKey(
        material.privateKeyJwk,
        generatedRecoveryKey,
      );

      // 4. Upload Public Key and Encrypted Private Key Backup to backend
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

      // 5. Save keypair locally in IndexedDB
      await storeKeyPair(material);

      setFingerprint(material.fingerprint);
      setRecoveryKey(generatedRecoveryKey);
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
    const fileContent = `====================================================\nLINKCHAT - EMERGENCY RECOVERY KEY\n====================================================\nUser ID     : ${user?.publicId || "N/A"}\nUsername    : ${user?.username || "N/A"}\nRecovery Key: ${recoveryKey}\n\nKEEP THIS FILE SAFE! If you clear your browser cache or log in from a new device, this key is required to decrypt your chat history.\n====================================================`;

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

  return (
    <AuthLayout aside={false}>
      <div className="setup-page">
        <div className="setup-progress">
          <span className="done">1</span>
          <i />
          <span className="current">2</span>
          <i />
          <span className={fingerprint ? "done" : ""}>3</span>
        </div>
        <div className="setup-icon">
          <Icon name={fingerprint ? "check" : "key"} size={35} />
        </div>
        <div className="auth-heading centered">
          <span className="eyebrow">SECURITY SETUP</span>
          <h1>
            {fingerprint
              ? "Your device key is ready."
              : "Set up your security key."}
          </h1>
          <p>
            {fingerprint
              ? "Your keys and encrypted recovery backup are configured. Save your Recovery Key to prevent data loss."
              : "LinkChat needs an ECDH P-256 key pair before this device can encrypt and decrypt messages."}
          </p>
        </div>

        {error && <Alert>{error}</Alert>}

        {!fingerprint ? (
          <div className="key-explainer">
            <div>
              <Icon name="key" size={20} />
              <span>
                <strong>Private key</strong>
                <small>
                  Stored locally in IndexedDB & backed up with encryption.
                </small>
              </span>
            </div>
            <div>
              <Icon name="shield" size={20} />
              <span>
                <strong>Public key</strong>
                <small>Uploaded through POST /api/keys.</small>
              </span>
            </div>
          </div>
        ) : (
          <div className="key-ready space-y-4">
            {/* Fingerprint Display */}
            <div className="fingerprint-box">
              <span>Your public fingerprint</span>
              <code>{formatFingerprint(fingerprint)}</code>
              <small>
                Compare this value with contacts through a trusted channel.
              </small>
            </div>

            {/* Recovery Key Display Box */}
            {recoveryKey && (
              <div className="recovery-box p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-sm">
                  <Icon name="shield" size={18} />
                  <span>YOUR ACCOUNT RECOVERY KEY</span>
                </div>

                <p className="text-xs text-muted">
                  Save this key in a secure place. If you clear browser cache or
                  switch devices, you will need this phrase to decrypt your chat
                  history.
                </p>

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

            <p>
              <Icon name="shield" size={17} /> The unencrypted private key was
              not sent to the server.
            </p>
          </div>
        )}

        <div className="setup-actions">
          <Button
            onClick={createKeys}
            icon="key"
            loading={busy}
            variant={fingerprint ? "secondary" : "primary"}
          >
            {fingerprint
              ? "Replace key & generate new backup"
              : "Generate key & recovery phrase"}
          </Button>

          {fingerprint && (
            <Button
              onClick={() => {
                console.log("Continue clicked");
                navigate("/dashboard");
              }}
              iconRight="arrowRight"
            >
              Continue to LinkChat
            </Button>
          )}
        </div>

        <p className="setup-note">
          <Icon name="lock" size={15} /> Clearing browser storage removes local
          private keys. Your Recovery Key lets you restore them anytime.
        </p>
      </div>
    </AuthLayout>
  );
}
