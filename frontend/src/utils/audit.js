/**
 * Audit-trail vocabulary.
 *
 * The API returns machine keys (`patient.view`) plus a `details` object naming
 * what was acted on. Both the admin dashboard and the audit log rendered only
 * the key, in a monospace font, and dropped `details` entirely — so the page
 * that exists to answer "who opened which patient record" could not answer it,
 * and nine failed sign-ins looked identical whether they targeted nine accounts
 * or one.
 */

const ACTION_LABELS = {
  "auth.login.success": "Signed in",
  "auth.login.failure": "Failed sign-in",
  "auth.login.inactive": "Blocked account sign-in",
  "auth.logout": "Signed out",
  "patient.view": "Opened patient record",
  "patient.create": "Created patient",
  "patient.update": "Updated patient",
  "patient.delete": "Removed patient",
  "diagnosis.run": "Ran a diagnosis",
  "report.download": "Downloaded report",
  "admin.doctor.create": "Created clinician account",
  "admin.doctor.update": "Updated clinician account",
  "access_request.submit": "Access request submitted",
  "access_request.review": "Reviewed access request",
  "access_request.document.view": "Opened credential document",
  "user.profile.update": "Updated own profile",
  "user.password.change.success": "Changed own password",
  "user.password.change.failure": "Failed password change",
};

/** Human label for an action key, falling back to the key itself. */
export const actionLabel = (action) => ACTION_LABELS[action] ?? action;

/**
 * Whether an action deserves visual weight. A failed sign-in against a real
 * account is the signal an admin scans this page for.
 */
export const isAlerting = (action) =>
  action === "auth.login.failure" ||
  action === "auth.login.inactive" ||
  action === "user.password.change.failure";

const shortId = (value) =>
  typeof value === "string" && value.length > 8 ? value.slice(0, 8) : value;

/**
 * What the action was performed on, in one short phrase.
 *
 * Deliberately shows the short id rather than looking up names: the audit log
 * must stay readable for records that have since been deleted, and resolving
 * every row would mean a query per line.
 */
export const actionSubject = (log) => {
  const d = log?.details;
  if (!d || typeof d !== "object") return null;

  if (d.email) return d.email;
  if (d.patient_id && d.diagnosis_id) {
    return `patient ${shortId(d.patient_id)} · diagnosis ${shortId(d.diagnosis_id)}`;
  }
  if (d.patient_id) return `patient ${shortId(d.patient_id)}`;
  if (d.diagnosis_id) return `diagnosis ${shortId(d.diagnosis_id)}`;
  if (d.doctor_id) {
    const fields = Array.isArray(d.fields) && d.fields.length ? ` (${d.fields.join(", ")})` : "";
    return `clinician ${shortId(d.doctor_id)}${fields}`;
  }
  if (d.request_id) return `request ${shortId(d.request_id)}`;

  const [key, value] = Object.entries(d)[0] ?? [];
  return key ? `${key}: ${shortId(value)}` : null;
};
