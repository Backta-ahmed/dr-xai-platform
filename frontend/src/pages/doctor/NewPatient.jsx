import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import PageWrapper from "../../components/layout/PageWrapper";
import ErrorState from "../../components/shared/ErrorState";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Field from "../../components/ui/Field";
import { LoadingPanel } from "../../components/ui/Spinner";
import api, { errorMessage } from "../../api/axios";

const NewPatient = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPatient, setLoadingPatient] = useState(Boolean(id));
  const [loadError, setLoadError] = useState(null);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    full_name: "",
    date_of_birth: "",
    gender: "",
    diabetes_type: "",
    diabetes_duration_years: "",
    phone: "",
    notes: "",
  });

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;

    // Previously this had no .catch: a failed load left the form silently blank,
    // and submitting it would overwrite the real record with empty values.
    const loadPatient = async () => {
      setLoadingPatient(true);
      setLoadError(null);
      try {
        const res = await api.get(`/patients/${id}`);
        if (cancelled) return;
        const p = res.data;
        setForm({
          full_name: p.full_name || "",
          date_of_birth: p.date_of_birth || "",
          gender: p.gender || "",
          diabetes_type: p.diabetes_type || "",
          diabetes_duration_years: p.diabetes_duration_years ?? "",
          phone: p.phone || "",
          notes: p.notes || "",
        });
      } catch (err) {
        if (!cancelled) {
          setLoadError(errorMessage(err, "This patient could not be loaded."));
        }
      } finally {
        if (!cancelled) setLoadingPatient(false);
      }
    };

    loadPatient();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    // Clear error when typing
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.full_name.trim()) newErrors.full_name = "Full Name is required";
    if (!form.diabetes_type) newErrors.diabetes_type = "Diabetes Type is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const payload = { ...form };
    const years = parseInt(payload.diabetes_duration_years, 10);
    if (Number.isFinite(years)) {
      payload.diabetes_duration_years = years;
    } else {
      delete payload.diabetes_duration_years;
    }
    if (!payload.gender) delete payload.gender;
    if (!payload.diabetes_type) delete payload.diabetes_type;
    if (!payload.date_of_birth) delete payload.date_of_birth;

    try {
      if (isEdit) {
        await api.put(`/patients/${id}`, payload);
        toast.success("Patient updated");
      } else {
        await api.post("/patients/", payload);
        toast.success("Patient created");
      }
      navigate("/patients");
    } catch (err) {
      toast.error(errorMessage(err, "Could not save this patient."));
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPatient) {
    return (
      <PageWrapper title="Edit Patient">
        <Card padding="none" className="mx-auto max-w-2xl">
          <LoadingPanel label="Loading patient" />
        </Card>
      </PageWrapper>
    );
  }

  // Refuse to show an editable form we could not populate — submitting it would
  // overwrite the stored record with blanks.
  if (loadError) {
    return (
      <PageWrapper title="Edit Patient">
        <Card padding="none" className="mx-auto max-w-2xl">
          <ErrorState message={loadError} onRetry={() => window.location.reload()} />
        </Card>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title={isEdit ? "Edit Patient" : "Add New Patient"}>
      <Card padding="md" className="mx-auto max-w-2xl">
        {/* Field owns the label/control/error wiring that this form previously
            hand-rolled with a copy-pasted class string per input. */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Field label="Full name" required error={errors.full_name}>
            {(p) => (
              <input
                {...p}
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date of birth">
              {(p) => (
                <input
                  {...p}
                  type="date"
                  name="date_of_birth"
                  value={form.date_of_birth}
                  onChange={handleChange}
                />
              )}
            </Field>

            <Field label="Gender">
              {(p) => (
                <select {...p} name="gender" value={form.gender} onChange={handleChange}>
                  <option value="">Select</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              )}
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Diabetes type" required error={errors.diabetes_type}>
              {(p) => (
                <select
                  {...p}
                  name="diabetes_type"
                  value={form.diabetes_type}
                  onChange={handleChange}
                >
                  <option value="">Select</option>
                  <option value="type1">Type 1</option>
                  <option value="type2">Type 2</option>
                  <option value="gestational">Gestational</option>
                  <option value="other">Other</option>
                </select>
              )}
            </Field>

            <Field label="Duration (years)">
              {(p) => (
                <input
                  {...p}
                  type="number"
                  name="diabetes_duration_years"
                  value={form.diabetes_duration_years}
                  onChange={handleChange}
                />
              )}
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone">
              {(p) => (
                <input
                  {...p}
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                />
              )}
            </Field>
          </div>

          <Field label="Notes">
            {(p) => (
              <textarea
                {...p}
                name="notes"
                rows={3}
                value={form.notes}
                onChange={handleChange}
              />
            )}
          </Field>

          <div className="flex justify-end gap-2 border-t border-gray-200 pt-4">
            <Button variant="secondary" onClick={() => navigate("/patients")}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Saving…" : isEdit ? "Update patient" : "Create patient"}
            </Button>
          </div>
        </form>
      </Card>
    </PageWrapper>
  );
};

export default NewPatient;
