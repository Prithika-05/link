import { useState } from "react";
import { useSelector } from "react-redux";
import Icon from "../components/common/Icon";
import { Avatar, Button } from "../components/common/UI";
import AppLayout from "../layouts/AppLayout";
import { getInitials } from "../utils/contact";

export default function ProfilePage() {
  const user = useSelector((state) => state.auth.user);

  // Recovery Key State
  const [showRecoveryKey, setShowRecoveryKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Retrieve saved recovery key
  const recoveryKey = user?.recoveryKey || "LKCH-8F92-1A3B-4C5D-6E7F-8A9B";

  const handleCopyRecoveryKey = async () => {
    if (!recoveryKey) return;
    await navigator.clipboard.writeText(recoveryKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
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

        {/* 2. Recovery Key Security Card */}
        <section className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-xs font-bold tracking-wider text-amber-500 uppercase">
                Account Recovery
              </span>
              <h2 className="text-lg font-bold text-foreground mt-0.5">
                Device Recovery Key
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                This key is required to restore your encrypted conversations if
                you log in on a new device or clear browser data.
              </p>
            </div>
            <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
              <Icon name="shield" size={24} />
            </div>
          </div>

          {/* Warning Banner */}
          <div className="p-3.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-3">
            <Icon name="shield" size={18} className="shrink-0" />
            <span>
              <strong>Keep this key secret!</strong> Anyone with this key can
              restore and decrypt your account backup.
            </span>
          </div>

          {/* Protected Recovery Key Display */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <div className="flex-1 p-3 rounded-lg bg-muted border border-border font-mono text-center sm:text-left text-sm font-semibold tracking-wider text-foreground select-all flex items-center justify-center sm:justify-start min-h-[42px]">
              {showRecoveryKey ? recoveryKey : "••••-••••-••••-••••-••••-••••"}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Reveal/Hide Key Button */}
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 sm:flex-initial text-xs h-10 inline-flex items-center justify-center gap-2 px-3"
                onClick={() => setShowRecoveryKey(!showRecoveryKey)}
              >
                <span>{showRecoveryKey ? "Hide Key" : "Reveal Key"}</span>
              </Button>

              {/* Copy Key Button */}
              <Button
                variant="primary"
                size="sm"
                className="flex-1 sm:flex-initial text-xs h-10 inline-flex items-center justify-center gap-2 px-3"
                onClick={handleCopyRecoveryKey}
                disabled={!showRecoveryKey}
              >
                <span>{copiedKey ? "Copied!" : "Copy"}</span>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
