import React, { useCallback, useState } from "react";
import { KeyRound, PlusCircle } from "lucide-react";
import toast from "react-hot-toast";

import PageWrapper from "../../components/layout/PageWrapper";
import ErrorState from "../../components/shared/ErrorState";
import Modal from "../../components/shared/Modal";
import Badge from "../../components/ui/Badge";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import { LoadingPanel } from "../../components/ui/Spinner";
import { TBody, TableShell, Td, Th, Tr } from "../../components/ui/DataTable";
import api, { errorMessage } from "../../api/axios";
import { useFetch } from "../../hooks/useFetch";
import { formatDate } from "../../utils/helpers";

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
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="max-w-prose text-sm text-gray-700">
          Clinician accounts on this platform. Deactivating revokes sign-in without
          deleting any patient or diagnosis record.
        </p>
        <Button variant="primary" onClick={() => setAddOpen(true)} className="flex-shrink-0">
          <PlusCircle size={16} aria-hidden="true" />
          Add doctor
        </Button>
      </div>

      <Card padding="none">
        {loading ? (
          <LoadingPanel label="Loading doctors" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : doctors.length === 0 ? (
          <p className="py-14 text-center text-sm text-gray-600">
            No doctor accounts yet.
          </p>
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <TBody>
              {doctors.map((doc, idx) => (
                <Tr key={doc.id} index={idx}>
                  <Td nowrap className="font-medium text-gray-900">
                    {doc.full_name}
                  </Td>
                  <Td nowrap>{doc.email}</Td>
                  <Td nowrap>
                    <Badge tone={doc.is_active ? "success" : "neutral"} size="sm">
                      {doc.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </Td>
                  <Td nowrap className="tabular text-xs">
                    {formatDate(doc.created_at)}
                  </Td>
                  <Td nowrap>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => setPendingToggle(doc)}>
                        {doc.is_active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setResetTarget(doc);
                          setNewPassword("");
                        }}
                      >
                        <KeyRound size={13} aria-hidden="true" />
                        Reset password
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </TableShell>
        )}
      </Card>

      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add a new doctor">
        <form onSubmit={handleAddDoctor} className="space-y-4">
          <Field label="Full name" required>
            {(p) => (
              <input
                {...p}
                type="text"
                maxLength={100}
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              />
            )}
          </Field>

          <Field label="Email" required>
            {(p) => (
              <input
                {...p}
                type="email"
                maxLength={150}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            )}
          </Field>

          <Field
            label="Temporary password"
            required
            hint="At least 8 characters. Share it with them directly and ask them to change it from their profile page after signing in."
          >
            {(p) => (
              <input
                {...p}
                type="password"
                minLength={8}
                maxLength={72}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            )}
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Adding…" : "Add doctor"}
            </Button>
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
        <div className="flex justify-end gap-2 pt-6">
          <Button variant="secondary" onClick={() => setPendingToggle(null)}>
            Cancel
          </Button>
          <Button
            variant={pendingToggle?.is_active ? "danger" : "primary"}
            onClick={confirmToggle}
          >
            {pendingToggle?.is_active ? "Deactivate" : "Reactivate"}
          </Button>
        </div>
      </Modal>

      <Modal
        open={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title={`Reset password for ${resetTarget?.full_name ?? ""}`}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <Field
            label="New password"
            required
            hint="At least 8 characters. Their existing sessions stay valid until their token expires."
          >
            {(p) => (
              <input
                {...p}
                type="password"
                minLength={8}
                maxLength={72}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            )}
          </Field>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="secondary" onClick={() => setResetTarget(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={submitting}>
              {submitting ? "Resetting…" : "Reset password"}
            </Button>
          </div>
        </form>
      </Modal>
    </PageWrapper>
  );
};

export default ManageDoctors;
