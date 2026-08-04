import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Icon from "../components/common/Icon";
import { Alert, Avatar, Button } from "../components/common/UI";
import AppLayout from "../layouts/AppLayout";
import { decryptPrivateKeyWithRecoveryKey } from "../services/cryptoService";
import { keyService } from "../services/keyService";
import { getInitials } from "../utils/contact";

export default function ProfilePage() {
  const user = useSelector((state) => state.auth.user);

  // Verification Form States
  const [testKeyInput, setTestKeyInput] = useState("");
  const [testing, setTesting] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState(null); // 'success' | 'error' | null
  const [verifyMessage, setVerifyMessage] = useState("");
  const [backupData, setBackupData] = useState(null);

  useEffect(() => {
    if (!user?.publicId) return;

    // Fetch user's encrypted backup payload for verification
    keyService
      .getKeyBackup()
      .then((data) => setBackupData(data))
      .catch(() => setBackupData(null));
  }, [user?.publicId]);

  const handleVerifyRecoveryKey = async (e) => {
    e.preventDefault();
    if (!testKeyInput.trim()) return;

    setTesting(true);
    setVerifyStatus(null);
    setVerifyMessage("");

    try {
      if (!backupData) {
        throw new Error("No backup key found on the server to verify against.");
      }

      // Perform local trial decryption using the candidate key
      await decryptPrivateKeyWithRecoveryKey(backupData, testKeyInput.trim());

      setVerifyStatus("success");
      setVerifyMessage(
        "✅ Recovery Key Verified! This phrase is valid and can restore your chats.",
      );
    } catch (err) {
      console.error(err);
      setVerifyStatus("error");
      setVerifyMessage(
        "❌ Invalid Recovery Key phrase. This key cannot decrypt your account backup.",
      );
    } finally {
      setTesting(false);
    }
  };

  if (!user) {
    return (
      <AppLayout>
        <div className="content-page narrow-page p-6 text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="content-page narrow-page max-w-2xl mx-auto py-8 space-y-6">
        {/* Page Header */}
        <header className="flex items-center justify-between border-b border-border pb-4">
          <div>
            <span className="text-xs font-bold tracking-wider text-indigo-500 uppercase">
              Account Management
            </span>
            <h1 className="text-2xl font-extrabold text-foreground mt-0.5">
              Profile & Security
            </h1>
          </div>
        </header>

        {/* 1. Profile Information Card */}
        <section className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <Avatar
              initials={getInitials(user.displayName || user.username || "U")}
              color="violet"
              size="xl"
              online
            />
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-foreground truncate">
                {user.displayName || user.username}
              </h2>
              <p className="text-sm text-muted-foreground truncate">
                {user.email}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                <Icon name="check" size={14} />
                <span>Verified End-to-End Account</span>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Recovery Key Verification Card */}
        <section className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold tracking-wider text-amber-500 uppercase">
                Zero-Knowledge Verification
              </span>
              <h2 className="text-lg font-bold text-foreground mt-0.5">
                Verify Your Recovery Key
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Test your saved Recovery Key to confirm it matches your
                encrypted account backup.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
              <Icon name="shield" size={24} />
            </div>
          </div>

          <form onSubmit={handleVerifyRecoveryKey} className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted block text-left">
                ENTER RECOVERY KEY TO VERIFY
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="LKCH-XXXX-XXXX-XXXX-XXXX-XXXX"
                  value={testKeyInput}
                  onChange={(e) => {
                    setTestKeyInput(e.target.value);
                    setVerifyStatus(null);
                  }}
                  className="flex-1 p-3 font-mono tracking-wider text-center sm:text-left text-sm rounded-lg border border-border bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={testing}
                />
                <Button
                  type="submit"
                  icon="shield"
                  loading={testing}
                  disabled={!testKeyInput.trim() || !backupData}
                  className="shrink-0"
                >
                  Verify Key
                </Button>
              </div>
            </div>
          </form>

          {verifyStatus === "success" && (
            <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
              {verifyMessage}
            </div>
          )}

          {verifyStatus === "error" && (
            <div className="p-3.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold">
              {verifyMessage}
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
}
