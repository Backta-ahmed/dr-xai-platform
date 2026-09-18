import React, { useCallback, useState } from "react";
import { Download, FileText } from "lucide-react";
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
import { formatDateTime } from "../../utils/helpers";

const STATUS_TONE = { pending: "warning", approved: "success", rejected: "danger" };
// The badge printed the raw enum value, so the status column read "pending"
// in lower case beside properly-cased headings and filter tabs.
const STATUS_LABEL = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
const FILTERS = [
  ["pending", "Pending"],
  ["approved", "Approved"],
  ["rejected", "Rejected"],
  ["", "All"],
];

const AccessRequests = () => {
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(null);

  const fetchRequests = useCallback(
    () =>
      api
        .get("/access-requests/", { params: filter ? { status: filter } : {} })
        .then((r) => r.data ?? []),
    [filter]
  );
  const { data, loading, error, reload } = useFetch(
    fetchRequests,
    [filter],
    "Could not load access requests."
  );
  const requests = data ?? [];

  const downloadDocument = async (requestId, index, filename) => {
    setDownloading(`${requestId}:${index}`);
    let url;
    try {
      const res = await api.get(`/access-requests/${requestId}/documents/${index}`, {
        responseType: "blob",
      });
      url = URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename || "document";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      toast.error(errorMessage(err, "Could not download that document."));
    } finally {
      if (url) URL.revokeObjectURL(url);
      setDownloading(null);
    }
  };

  const review = async (status) => {
    setSaving(true);
    try {
      await api.patch(`/access-requests/${selected.id}`, {
        status,
        review_note: note || null,
      });
      toast.success(
        status === "approved"
          ? "Credentials marked verified. Create the account from Manage Doctors."
          : "Request rejected."
      );
      setSelected(null);
      setNote("");
      reload();
    } catch (err) {
      toast.error(errorMessage(err, "Could not record that decision."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageWrapper title="Access Requests">
      <p className="mb-4 max-w-prose text-sm text-gray-700">
        Applications from clinicians requesting access. Verify the attached
        credentials against the medical register before approving. Approving
        records the verification — it does not create an account; add the
        clinician from Manage Doctors afterwards.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(([value, label]) => (
          <button
            key={label}
            type="button"
            onClick={() => setFilter(value)}
            aria-pressed={filter === value}
            className={`rounded-control px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === value
                ? "bg-cyprus text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:border-accent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <Card padding="none">
        {loading ? (
          <LoadingPanel label="Loading requests" />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : requests.length === 0 ? (
          <p className="py-14 text-center text-sm text-gray-600">
            No {filter || ""} requests.
          </p>
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>Applicant</Th>
                <Th>Registration</Th>
                <Th>Institution</Th>
                <Th>Documents</Th>
                <Th>Submitted</Th>
                <Th>Status</Th>
                <Th>Review</Th>
              </tr>
            </thead>
            <TBody>
              {requests.map((req, i) => (
                <Tr key={req.id} index={i}>
                  <Td nowrap>
                    <span className="font-medium text-gray-900">{req.full_name}</span>
                    <span className="block text-xs text-gray-600">{req.email}</span>
                  </Td>
                  <Td nowrap className="font-mono text-xs">{req.license_number}</Td>
                  <Td>
                    {req.institution || "—"}
                    {req.country && (
                      <span className="block text-xs text-gray-600">{req.country}</span>
                    )}
                  </Td>
                  <Td nowrap>
                    <div className="flex flex-col gap-1">
                      {req.documents.map((doc) => (
                        <button
                          key={doc.index}
                          type="button"
                          onClick={() => downloadDocument(req.id, doc.index, doc.filename)}
                          disabled={downloading === `${req.id}:${doc.index}`}
                          className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-cyprus disabled:opacity-40"
                        >
                          <FileText size={13} aria-hidden="true" />
                          <span className="max-w-[9rem] truncate">{doc.filename}</span>
                          <Download size={12} aria-hidden="true" />
                        </button>
                      ))}
                    </div>
                  </Td>
                  <Td nowrap className="tabular text-xs">
                    {formatDateTime(req.created_at)}
                  </Td>
                  <Td nowrap>
                    <Badge tone={STATUS_TONE[req.status] ?? "neutral"} size="sm">
                      {STATUS_LABEL[req.status] ?? req.status}
                    </Badge>
                    {req.reviewer_name && (
                      <span className="mt-1 block text-2xs text-gray-600">
                        by {req.reviewer_name}
                      </span>
                    )}
                  </Td>
                  <Td nowrap>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelected(req);
                        setNote(req.review_note || "");
                      }}
                    >
                      {req.status === "pending" ? "Review" : "Revisit"}
                    </Button>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </TableShell>
        )}
      </Card>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={`Review — ${selected?.full_name ?? ""}`}
      >
        {selected && (
          <div className="space-y-4">
            <dl className="space-y-1.5 text-sm">
              {[
                ["Email", selected.email],
                ["Registration", selected.license_number],
                ["Institution", selected.institution || "—"],
                ["Country", selected.country || "—"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4">
                  <dt className="text-gray-600">{label}</dt>
                  <dd className="text-right font-medium text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>

            {selected.message && (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
                  Message
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-700">
                  {selected.message}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-600">
                Documents
              </p>
              <div className="mt-2 flex flex-col gap-1.5">
                {selected.documents.map((doc) => (
                  <button
                    key={doc.index}
                    type="button"
                    onClick={() => downloadDocument(selected.id, doc.index, doc.filename)}
                    className="inline-flex items-center gap-2 rounded-control border border-gray-200 bg-sand-light px-3 py-2 text-left text-sm text-gray-800 hover:border-accent"
                  >
                    <FileText size={15} className="flex-shrink-0 text-accent" aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{doc.filename}</span>
                    <Download size={13} className="flex-shrink-0 text-accent" aria-hidden="true" />
                  </button>
                ))}
              </div>
            </div>

            <Field label="Review note" hint="Recorded in the audit log.">
              {(p) => (
                <textarea
                  {...p}
                  rows={3}
                  maxLength={2000}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              )}
            </Field>

            <p className="rounded-control bg-sand-light px-3 py-2 text-xs leading-relaxed text-gray-700">
              Approving records that you verified these credentials. It does not
              create an account — add the clinician from Manage Doctors.
            </p>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="secondary" onClick={() => setSelected(null)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={() => review("rejected")} disabled={saving}>
                Reject
              </Button>
              <Button variant="primary" onClick={() => review("approved")} disabled={saving}>
                {saving ? "Saving…" : "Approve"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageWrapper>
  );
};

export default AccessRequests;
