"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { UserPreferencesSchema } from "@/lib/validation/schemas";
import type { UserPreferences } from "@/lib/validation/schemas";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Toast from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";
import Toggle from "@/components/ui/Toggle";
import Skeleton from "@/components/ui/Skeleton";

type PreferenceKey = keyof UserPreferences;

const PREFERENCE_ITEMS: { key: PreferenceKey; label: string; description: string }[] = [
  { key: "show_overview_panel", label: "Overview Panel", description: "Compliance score summary and status breakdown" },
  { key: "show_model_inventory", label: "Model Inventory", description: "Table of all assessed models and scores" },
  { key: "show_score_progression", label: "Score Progression Chart", description: "Score trends across model versions" },
  { key: "show_recent_activity", label: "Recent Activity Feed", description: "Latest compliance check submissions" },
];

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const [supabase] = useState(() => createClient());

  // Preferences
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [savingKey, setSavingKey] = useState<PreferenceKey | null>(null);

  // Account
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [passwordResetSending, setPasswordResetSending] = useState(false);

  // Delete account
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Password recovery
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error") => {
    setToast({ message, type });
  }, []);

  // Load user, preferences, and auth state listener
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserId(user.id);
      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("user_preferences")
        .select("show_overview_panel, show_model_inventory, show_score_progression, show_recent_activity")
        .single();

      setPrefs(UserPreferencesSchema.parse(data ?? {}));
    }

    init();

    // Check for recovery mode via URL param
    if (searchParams.get("type") === "recovery") {
      setRecoveryMode(true);
    }

    // Listen for PASSWORD_RECOVERY auth event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setRecoveryMode(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, searchParams]);

  // Toggle a preference
  async function handleToggle(key: PreferenceKey) {
    if (!prefs || !userId) return;

    const previousValue = prefs[key];
    const newValue = !previousValue;

    // Optimistic update
    setPrefs({ ...prefs, [key]: newValue });
    setSavingKey(key);

    const { error } = await supabase
      .from("user_preferences")
      .upsert({ user_id: userId, [key]: newValue }, { onConflict: "user_id" });

    setSavingKey(null);

    if (error) {
      setPrefs({ ...prefs, [key]: previousValue });
      showToast("Failed to update preference", "error");
    } else {
      showToast("Preferences updated", "success");
    }
  }

  // Change password (send reset email)
  async function handleChangePassword() {
    setPasswordResetSending(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/settings`,
    });
    setPasswordResetSending(false);

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Password reset email sent", "success");
    }
  }

  // Update password (recovery mode)
  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);

    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPassword(false);

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Password updated successfully", "success");
      setRecoveryMode(false);
      setNewPassword("");
      setConfirmNewPassword("");
    }
  }

  // Delete account
  async function handleDeleteAccount() {
    if (!userId) return;
    setDeleting(true);

    // Delete models — cascades to submissions → (gaps + evals)
    const { error: modelsErr } = await supabase
      .from("models")
      .delete()
      .eq("user_id", userId);

    if (modelsErr) {
      showToast("Failed to delete account data", "error");
      setDeleting(false);
      return;
    }

    // Delete user preferences
    const { error: prefsErr } = await supabase
      .from("user_preferences")
      .delete()
      .eq("user_id", userId);

    if (prefsErr) {
      showToast("Failed to delete account data", "error");
      setDeleting(false);
      return;
    }

    // Sign out (client can't delete auth user — requires service role)
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const isLoading = prefs === null && email === "";

  const inputStyle: React.CSSProperties = {
    fontFamily: "var(--font-geist)",
    fontSize: "14px",
    color: "var(--color-text-primary)",
    background: "var(--color-bg-primary)",
    border: "1px solid var(--color-border)",
    borderRadius: "2px",
    padding: "11px 14px",
    width: "100%",
    outline: "none",
    transition: "border-color 0.15s ease",
  };

  return (
    <main style={{ background: "var(--color-bg-primary)", minHeight: "100vh", padding: "32px 20px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* Page heading */}
        <div style={{ marginBottom: "32px" }}>
          <h1 style={{
            fontFamily: "var(--font-playfair)",
            fontSize: "28px",
            fontWeight: 700,
            color: "var(--color-text-primary)",
            margin: 0,
            lineHeight: 1.2,
          }}>
            Settings
          </h1>
          <p style={{
            fontFamily: "var(--font-geist)",
            fontSize: "14px",
            color: "var(--color-text-secondary)",
            margin: "8px 0 0",
          }}>
            Manage your dashboard and account
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* ── Password Recovery Form (conditional) ── */}
          {recoveryMode && (
            <Card animate delay={0} style={{ borderColor: "var(--color-accent)" }}>
              <h2 style={{
                fontFamily: "var(--font-playfair)",
                fontSize: "20px",
                fontWeight: 700,
                color: "var(--color-text-primary)",
                margin: "0 0 16px 0",
              }}>
                Set New Password
              </h2>
              <form onSubmit={handleUpdatePassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{
                    fontFamily: "var(--font-geist)",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--color-text-secondary)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={updatingPassword}
                    style={{ ...inputStyle, opacity: updatingPassword ? 0.5 : 1 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={{
                    fontFamily: "var(--font-geist)",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--color-text-secondary)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    disabled={updatingPassword}
                    style={{ ...inputStyle, opacity: updatingPassword ? 0.5 : 1 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                    onBlur={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                  />
                </div>
                {passwordError && (
                  <p style={{ fontFamily: "var(--font-geist)", fontSize: "13px", color: "var(--color-critical)", margin: 0 }}>
                    {passwordError}
                  </p>
                )}
                <Button type="submit" disabled={updatingPassword}>
                  {updatingPassword ? "Updating…" : "Update Password"}
                </Button>
              </form>
            </Card>
          )}

          {/* ── Dashboard Preferences ── */}
          <Card animate delay={0.1}>
            <h2 style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: "0 0 20px 0",
            }}>
              Dashboard Preferences
            </h2>

            {isLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0" }}>
                    <div>
                      <Skeleton width={140} height={14} style={{ marginBottom: 6 }} />
                      <Skeleton width={220} height={12} />
                    </div>
                    <Skeleton width={36} height={20} borderRadius={10} />
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {PREFERENCE_ITEMS.map((item, index) => (
                  <div
                    key={item.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 0",
                      borderTop: index > 0 ? "1px solid var(--color-border)" : undefined,
                    }}
                  >
                    <div style={{ marginRight: "16px" }}>
                      <div style={{
                        fontFamily: "var(--font-geist)",
                        fontSize: "13px",
                        fontWeight: 500,
                        color: "var(--color-text-primary)",
                        marginBottom: "3px",
                      }}>
                        {item.label}
                      </div>
                      <div style={{
                        fontFamily: "var(--font-geist)",
                        fontSize: "12px",
                        color: "var(--color-text-secondary)",
                      }}>
                        {item.description}
                      </div>
                    </div>
                    <Toggle
                      checked={prefs?.[item.key] ?? true}
                      onChange={() => handleToggle(item.key)}
                      disabled={savingKey === item.key}
                    />
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── Account ── */}
          <Card animate delay={0.2}>
            <h2 style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--color-text-primary)",
              margin: "0 0 20px 0",
            }}>
              Account
            </h2>

            {isLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <Skeleton width={40} height={12} style={{ marginBottom: 8 }} />
                  <Skeleton width={200} height={14} />
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  <Skeleton width={140} height={32} />
                  <Skeleton width={120} height={32} />
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                {/* Email */}
                <div>
                  <div style={{
                    fontFamily: "var(--font-geist)",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--color-text-secondary)",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    marginBottom: "6px",
                  }}>
                    Email
                  </div>
                  <div style={{
                    fontFamily: "var(--font-ibm-plex-mono)",
                    fontSize: "13px",
                    color: "var(--color-text-primary)",
                  }}>
                    {email}
                  </div>
                </div>

                {/* Actions */}
                <div style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  paddingTop: "4px",
                  borderTop: "1px solid var(--color-border)",
                }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleChangePassword}
                    disabled={passwordResetSending}
                  >
                    {passwordResetSending ? "Sending…" : "Change Password"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteModalOpen(true)}
                    style={{ color: "var(--color-critical)", borderColor: "var(--color-critical)" }}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Delete Account Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => { setDeleteModalOpen(false); setDeleteConfirmText(""); }}
        title="Delete Account"
      >
        <p style={{
          fontFamily: "var(--font-geist)",
          fontSize: "13px",
          color: "var(--color-text-secondary)",
          margin: "0 0 16px 0",
          lineHeight: 1.6,
        }}>
          This action is permanent and cannot be undone. All your models, submissions, and compliance data will be deleted.
        </p>
        <div style={{ marginBottom: "16px" }}>
          <label style={{
            fontFamily: "var(--font-geist)",
            fontSize: "12px",
            fontWeight: 500,
            color: "var(--color-text-secondary)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            display: "block",
            marginBottom: "6px",
          }}>
            Type DELETE to confirm
          </label>
          <input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            disabled={deleting}
            style={{
              fontFamily: "var(--font-ibm-plex-mono)",
              fontSize: "13px",
              color: "var(--color-text-primary)",
              background: "var(--color-bg-primary)",
              border: "1px solid var(--color-border)",
              borderRadius: "2px",
              padding: "9px 12px",
              width: "100%",
              outline: "none",
              opacity: deleting ? 0.5 : 1,
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setDeleteModalOpen(false); setDeleteConfirmText(""); }}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleDeleteAccount}
            disabled={deleteConfirmText !== "DELETE" || deleting}
            style={{
              background: deleteConfirmText === "DELETE" && !deleting ? "var(--color-critical)" : undefined,
              borderColor: "var(--color-critical)",
            }}
          >
            {deleting ? "Deleting…" : "Delete Account"}
          </Button>
        </div>
      </Modal>

      {/* Toast */}
      <Toast
        message={toast?.message ?? ""}
        type={toast?.type ?? "success"}
        visible={toast !== null}
        onClose={() => setToast(null)}
      />
    </main>
  );
}
