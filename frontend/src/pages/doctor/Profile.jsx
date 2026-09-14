import React, { useState } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import { useAuth } from "../../hooks/useAuth";
import api, { errorMessage } from "../../api/axios";
import toast from "react-hot-toast";

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

  const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent text-sm";

  return (
    <PageWrapper title="Profile">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Profile Form */}
        <form onSubmit={handleSaveProfile} className="bg-white rounded-xl shadow-card p-8 space-y-5">
          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input type="email" value={user?.email || ""} disabled className={`${inputClass} bg-gray-100 cursor-not-allowed`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <input type="text" value={user?.role || ""} disabled className={`${inputClass} bg-gray-100 cursor-not-allowed capitalize`} />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="px-6 py-2 bg-cyprus text-white rounded-lg hover:bg-cyprus-light disabled:opacity-50 transition-colors text-sm font-medium">
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Change Password */}
        <form onSubmit={handleChangePassword} className="bg-white rounded-xl shadow-card p-8 space-y-5">
          <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700">Current Password</label>
            <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputClass} />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={changingPw} className="px-6 py-2 bg-cyprus text-white rounded-lg hover:bg-cyprus-light disabled:opacity-50 transition-colors text-sm font-medium">
              {changingPw ? "Updating..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default Profile;
