import React, { useState } from "react";
import toast from "react-hot-toast";

import PageWrapper from "../../components/layout/PageWrapper";
import Button from "../../components/ui/Button";
import Card, { CardHeading } from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import { useAuth } from "../../hooks/useAuth";
import api, { errorMessage } from "../../api/axios";

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put("/users/me/profile", { full_name: fullName });
      // Re-read the user so the sidebar picks up the new name immediately;
      // without this it kept showing the old one until a full page reload.
      await refreshUser();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(errorMessage(err, "Could not update your profile."));
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setChangingPw(true);
    try {
      await api.put("/users/me/password", { old_password: oldPassword, new_password: newPassword });
      toast.success("Password changed");
      setOldPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (err) {
      toast.error(errorMessage(err, "Could not change your password."));
    } finally {
      setChangingPw(false);
    }
  };

  return (
    <PageWrapper title="Profile">
      <div className="mx-auto max-w-2xl space-y-6">
        <Card>
          <CardHeading as="h2">Personal information</CardHeading>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Field label="Full name">
              {(p) => (
                <input
                  {...p}
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              )}
            </Field>

            <Field label="Email" hint="Email and role are set by an administrator.">
              {(p) => <input {...p} type="email" value={user?.email || ""} disabled />}
            </Field>

            <Field label="Role">
              {(p) => (
                <input
                  {...p}
                  type="text"
                  className={`${p.className} capitalize`}
                  value={user?.role || ""}
                  disabled
                />
              )}
            </Field>

            <div className="flex justify-end pt-1">
              <Button variant="primary" type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </Card>

        <Card>
          <CardHeading as="h2">Change password</CardHeading>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Field label="Current password" required>
              {(p) => (
                <input
                  {...p}
                  type="password"
                  autoComplete="current-password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              )}
            </Field>

            <Field label="New password" required hint="At least 8 characters.">
              {(p) => (
                <input
                  {...p}
                  type="password"
                  autoComplete="new-password"
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              )}
            </Field>

            <Field label="Confirm new password" required>
              {(p) => (
                <input
                  {...p}
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              )}
            </Field>

            {/* accent, not a second primary: one primary per view, and that one
                belongs to the form this page is named after. */}
            <div className="flex justify-end pt-1">
              <Button variant="accent" type="submit" disabled={changingPw}>
                {changingPw ? "Updating…" : "Change password"}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </PageWrapper>
  );
};

export default Profile;
