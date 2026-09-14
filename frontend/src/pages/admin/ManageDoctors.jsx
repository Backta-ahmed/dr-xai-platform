import React, { useCallback, useState } from "react";
import { KeyRound, PlusCircle } from "lucide-react";
import toast from "react-hot-toast";

import PageWrapper from "../../components/layout/PageWrapper";
import ErrorState from "../../components/shared/ErrorState";
import Modal from "../../components/shared/Modal";
import api, { errorMessage } from "../../api/axios";
import { useFetch } from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

const INPUT_CLASS =
  "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-accent";

const EMPTY_FORM = { full_name: "", email: "", password: "" };

const ManageDoctors = () => {
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  // Confirmation before deactivating: this revokes a doctor's access, and it
  // used to happen instantly on a single click.
  const [pendingToggle, setPendingToggle] = useState(null);

  const [resetTarget, setResetTarget] = useState(null);
  const [newPassword, setNewPassword] = useState("");

  const fetchDoctors = useCallback(
    () => api.get("/admin/doctors").then((r) => r.data ?? []),
    []
  );
  const { data, loading, error, reload: load } = useFetch(
    fetchDoctors,
    [],
    "Could not load the doctor list."
  );
  const doctors = data ?? [];

  const handleAddDoctor = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/admin/doctors", { ...form, role: "doctor" });
      toast.success(`${form.full_name} can now sign in.`);
      setAddOpen(false);
      setForm(EMPTY_FORM);
      load();
    } catch (err) {
      toast.error(errorMessage(err, "Could not create that account."));
    } finally {
      setSubmitting(false);
    }
  };

  const confirmToggle = async () => {
    const doctor = pendingToggle;
    setPendingToggle(null);
    try {
      await api.put(`/admin/doctors/${doctor.id}`, { is_active: !doctor.is_active });
      toast.success(
        `${doctor.full_name} ${doctor.is_active ? "deactivated" : "reactivated"}.`
      );
      load();
    } catch (err) {
      toast.error(errorMessage(err, "Could not update that account."));
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // The backend applies this now; it previously accepted the field,
      // discarded it, and still returned success.
      await api.put(`/admin/doctors/${resetTarget.id}`, { password: newPassword });
      toast.success(`Password reset for ${resetTarget.full_name}.`);
      setResetTarget(null);
      setNewPassword("");
    } catch (err) {
      toast.error(errorMessage(err, "Could not reset that password."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageWrapper title="Manage Doctors">
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center rounded-lg bg-cyprus px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-cyprus-light"
        >
          <PlusCircle size={18} className="mr-2" aria-hidden="true" /> Add doctor
        </button>
      </div>

      <div className="rounded-xl bg-white shadow-card">
        {loading ? (
          <div className="flex justify-center py-16">
            <div
              role="status"
              aria-label="Loading"
              className="h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-cyprus"
            />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : doctors.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-600">
            No doctor accounts yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-sand">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">Created</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {doctors.map((doc, idx) => (
                  <tr key={doc.id} className={idx % 2 === 0 ? "bg-white" : "bg-sand-light"}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                      {doc.full_name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {doc.email}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          doc.is_active
                            ? "bg-green-100 text-green-900"
                            : "bg-red-100 text-red-900"
                        }`}
                      >
                        {doc.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="space-x-4 whitespace-nowrap px-6 py-4 text-sm">
                      <button
                        onClick={() => setPendingToggle(doc)}
                        className="font-medium text-accent transition-colors hover:text-cyprus"
                      >
                        {doc.is_active ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => {
                          setResetTarget(doc);
                          setNewPassword("");
                        }}
                        className="inline-flex items-center font-medium text-accent transition-colors hover:text-cyprus"
                      >
                        <KeyRound size={14} className="mr-1" aria-hidden="true" /> Reset password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add a new doctor">
        <form onSubmit={handleAddDoctor} className="space-y-4">
          <div>
            <label htmlFor="doc-name" className="block text-sm font-medium text-gray-700">
              Full name
            </label>
            <input
              id="doc-name"
              type="text"
              required
              maxLength={100}
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="doc-email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="doc-email"
              type="email"
              required
              maxLength={150}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={INPUT_CLASS}
            />
          </div>
          <div>
            <label htmlFor="doc-password" className="block text-sm font-medium text-gray-700">
              Temporary password
            </label>
            <input
              id="doc-password"
              type="password"
              required
              minLength={8}
              maxLength={72}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={INPUT_CLASS}
            />
            <p className="mt-1 text-xs text-gray-600">
              At least 8 characters. Share it with them directly and ask them to change
              it from their profile page after signing in.
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setAddOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-cyprus px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-cyprus-light disabled:opacity-50"
            >
              {submitting ? "Adding…" : "Add doctor"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={Boolean(pendingToggle)}
        onClose={() => setPendingToggle(null)}
        title={pendingToggle?.is_active ? "Deactivate this account?" : "Reactivate this account?"}
      >
        <p className="text-sm leading-relaxed text-gray-700">
          {pendingToggle?.is_active ? (
            <>
              <strong>{pendingToggle?.full_name}</strong> will be signed out and unable
              to sign in again. Their patients and diagnosis records are kept and will
              reappear if the account is reactivated.
            </>
          ) : (
            <>
              <strong>{pendingToggle?.full_name}</strong> will be able to sign in again
              with their existing password.
            </>
          )}
        </p>
        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={() => setPendingToggle(null)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmToggle}
            className={`rounded-lg px-6 py-2 text-sm font-medium text-white transition-colors ${
              pendingToggle?.is_active
                ? "bg-danger hover:bg-danger/90"
                : "bg-cyprus hover:bg-cyprus-light"
            }`}
          >
            {pendingToggle?.is_active ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title={`Reset password for ${resetTarget?.full_name ?? ""}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label htmlFor="reset-pw" className="block text-sm font-medium text-gray-700">
              New password
            </label>
            <input
              id="reset-pw"
              type="password"
              required
              minLength={8}
              maxLength={72}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={INPUT_CLASS}
            />
            <p className="mt-1 text-xs text-gray-600">
              At least 8 characters. Their existing sessions stay valid until their
              token expires.
            </p>
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setResetTarget(null)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-cyprus px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-cyprus-light disabled:opacity-50"
            >
              {submitting ? "Resetting…" : "Reset password"}
            </button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default ManageDoctors;
