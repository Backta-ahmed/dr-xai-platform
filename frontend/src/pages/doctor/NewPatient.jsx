import React, { useState, useEffect } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import ErrorState from "../../components/shared/ErrorState";
import api, { errorMessage } from "../../api/axios";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

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

  const inputClass = "mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-accent focus:border-accent text-sm";
  const errorInputClass = "border-danger focus:ring-danger focus:border-danger";

  if (loadingPatient) {
    return (
      <PageWrapper title="Edit Patient">
        <div className="flex justify-center py-20">
          <div
            role="status"
            aria-label="Loading"
            className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-cyprus"
          />
        </div>
      </PageWrapper>
    );
  }

  // Refuse to show an editable form we could not populate — submitting it would
  // overwrite the stored record with blanks.
  if (loadError) {
    return (
      <PageWrapper title="Edit Patient">
        <div className="mx-auto max-w-2xl rounded-xl bg-white shadow-card">
          <ErrorState message={loadError} onRetry={() => window.location.reload()} />
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title={isEdit ? "Edit Patient" : "Add New Patient"}>
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-xl shadow-card p-8 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name *</label>
            <input 
              type="text" 
              name="full_name" 
              value={form.full_name} 
              onChange={handleChange} 
              className={`${inputClass} ${errors.full_name ? errorInputClass : ''}`} 
            />
            {errors.full_name && <p className="mt-1 text-xs text-danger">{errors.full_name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
              <input type="date" name="date_of_birth" value={form.date_of_birth} onChange={handleChange} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select name="gender" value={form.gender} onChange={handleChange} className={inputClass}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Diabetes Type *</label>
              <select 
                name="diabetes_type" 
                value={form.diabetes_type} 
                onChange={handleChange} 
                className={`${inputClass} ${errors.diabetes_type ? errorInputClass : ''}`}
              >
                <option value="">Select</option>
                <option value="type1">Type 1</option>
                <option value="type2">Type 2</option>
                <option value="gestational">Gestational</option>
                <option value="other">Other</option>
              </select>
              {errors.diabetes_type && <p className="mt-1 text-xs text-danger">{errors.diabetes_type}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Duration (years)</label>
              <input type="number" name="diabetes_duration_years" value={form.diabetes_duration_years} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} className={inputClass} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea name="notes" rows={3} value={form.notes} onChange={handleChange} className={inputClass}></textarea>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={() => navigate("/patients")} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm">Cancel</button>
            <button type="submit" disabled={submitting} className="px-6 py-2 bg-cyprus text-white rounded-lg hover:bg-cyprus-light disabled:opacity-50 transition-colors text-sm font-medium">
              {submitting ? "Saving..." : isEdit ? "Update Patient" : "Create Patient"}
            </button>
          </div>
        </form>
      </div>
    </PageWrapper>
  );
};

export default NewPatient;
