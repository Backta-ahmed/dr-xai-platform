import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, FileText, Upload, X } from "lucide-react";

import Button from "../../components/ui/Button";
import Field from "../../components/ui/Field";
import api, { errorMessage } from "../../api/axios";
import { ROUTES } from "../../constants";

const MAX_FILES = 4;
const MAX_BYTES = 8 * 1024 * 1024;
// Mirrors the server: images are re-encoded, PDFs validated by magic bytes.
// These checks only give fast feedback — the server re-validates everything.
const ACCEPTED = "application/pdf,image/jpeg,image/png,image/tiff,image/webp";

const formatSize = (bytes) =>
  bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

const RequestAccess = () => {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    license_number: "",
    institution: "",
    country: "",
    message: "",
  });
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (submitted) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [submitted]);

  const update = (name) => (e) => {
    setForm((f) => ({ ...f, [name]: e.target.value }));
    if (errors[name]) setErrors((x) => ({ ...x, [name]: null }));
  };

  const addFiles = (incoming) => {
    const next = [...files];
    for (const file of incoming) {
      if (next.length >= MAX_FILES) {
        setFormError(`You can attach at most ${MAX_FILES} documents.`);
        break;
      }
      if (file.size > MAX_BYTES) {
        setFormError(`“${file.name}” is larger than 8 MB.`);
        continue;
      }
      if (!ACCEPTED.split(",").includes(file.type)) {
        setFormError(`“${file.name}” must be a PDF or an image.`);
        continue;
      }
      if (next.some((f) => f.name === file.name && f.size === file.size)) continue;
      next.push(file);
    }
    setFiles(next);
    if (inputRef.current) inputRef.current.value = "";
  };

  const validate = () => {
    const next = {};
    if (form.full_name.trim().length < 2) next.full_name = "Enter your full name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      next.email = "Enter a valid email address.";
    if (form.license_number.trim().length < 2)
      next.license_number = "Enter your registration number.";
    setErrors(next);
    if (files.length === 0) {
      setFormError("Attach at least one document proving your qualification.");
      return false;
    }
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    const body = new FormData();
    Object.entries(form).forEach(([k, v]) => v && body.append(k, v));
    files.forEach((f) => body.append("documents", f));

    try {
      await api.post("/access-requests/", body, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 120000,
      });
      setSubmitted(true);
    } catch (err) {
      setFormError(errorMessage(err, "Your request could not be submitted."));
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand px-5 py-12">
        <div className="w-full max-w-lg rounded-card bg-white p-8 shadow-card">
          <CheckCircle2 size={34} className="text-success" aria-hidden="true" />
          <h1 className="mt-4 text-lg font-semibold tracking-tight text-gray-900">
            Request received
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">
            An administrator will verify your credentials against the medical
            register and contact you by email. We do not disclose how long review
            takes, and no account exists until verification completes.
          </p>
          <Link to={ROUTES.HOME} className="mt-6 inline-block">
            <Button variant="secondary">Back to home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand px-5 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          to={ROUTES.HOME}
          className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-cyprus"
        >
          <ArrowLeft size={15} aria-hidden="true" /> Home
        </Link>

        <h1 className="mt-5 text-xl font-bold tracking-tight text-cyprus">
          Request clinician access
        </h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-gray-700">
          Access is limited to qualified ophthalmologists. Submit your details
          with proof of qualification; an administrator verifies your credentials
          before an account is created.
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
          <div className="space-y-5 rounded-card bg-white p-6 shadow-card">
            <Field label="Full name" required error={errors.full_name}>
              {(p) => (
                <input {...p} type="text" maxLength={100} value={form.full_name} onChange={update("full_name")} />
              )}
            </Field>

            <Field
              label="Email address"
              required
              error={errors.email}
              hint="The address an administrator will reply to."
            >
              {(p) => (
                <input {...p} type="email" maxLength={150} value={form.email} onChange={update("email")} />
              )}
            </Field>

            <Field
              label="Medical council registration number"
              required
              error={errors.license_number}
              hint="As it appears on your licence or specialist certificate."
            >
              {(p) => (
                <input {...p} type="text" maxLength={100} value={form.license_number} onChange={update("license_number")} />
              )}
            </Field>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Institution">
                {(p) => (
                  <input {...p} type="text" maxLength={200} value={form.institution} onChange={update("institution")} />
                )}
              </Field>
              <Field label="Country">
                {(p) => (
                  <input {...p} type="text" maxLength={100} value={form.country} onChange={update("country")} />
                )}
              </Field>
            </div>

            <Field label="Message" hint="Optional — how you intend to use the platform.">
              {(p) => (
                <textarea {...p} rows={3} maxLength={2000} value={form.message} onChange={update("message")} />
              )}
            </Field>
          </div>

          <div className="rounded-card bg-white p-6 shadow-card">
            <h2 className="text-sm font-medium text-gray-700">
              Proof of qualification
              <span className="ml-0.5 text-danger" aria-hidden="true">*</span>
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">
              Medical licence, ophthalmology specialist certificate, or council
              registration. PDF or image, up to {MAX_FILES} files, 8 MB each.
              Documents are stored privately and visible only to administrators.
            </p>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(Array.from(e.dataTransfer.files || []));
              }}
              className="mt-4 rounded-control border-2 border-dashed border-cyprus/30 p-6 text-center transition-colors hover:border-accent"
            >
              <Upload className="mx-auto h-8 w-8 text-cyprus/40" aria-hidden="true" />
              <p className="mt-2 text-sm text-gray-700">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="font-medium text-accent underline"
                >
                  Choose files
                </button>{" "}
                or drag them here
              </p>
              <input
                ref={inputRef}
                id="credential-documents"
                type="file"
                multiple
                accept={ACCEPTED}
                onChange={(e) => addFiles(Array.from(e.target.files || []))}
                className="sr-only"
              />
            </div>

            {files.length > 0 && (
              <ul className="mt-4 space-y-2">
                {files.map((file, i) => (
                  <li
                    key={`${file.name}-${file.size}`}
                    className="flex items-center gap-3 rounded-control border border-gray-200 bg-sand-light px-3 py-2"
                  >
                    <FileText size={16} className="flex-shrink-0 text-accent" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate text-sm text-gray-800">{file.name}</span>
                    <span className="tabular flex-shrink-0 text-xs text-gray-600">
                      {formatSize(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles(files.filter((_, x) => x !== i))}
                      aria-label={`Remove ${file.name}`}
                      className="flex-shrink-0 rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-800"
                    >
                      <X size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {formError && (
            <p role="alert" className="rounded-control bg-danger-wash px-4 py-3 text-sm text-danger-ink">
              {formError}
            </p>
          )}

          <div className="flex justify-end gap-3">
            <Link to={ROUTES.HOME}>
              <Button variant="secondary" size="lg">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary" size="lg" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit request"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RequestAccess;
