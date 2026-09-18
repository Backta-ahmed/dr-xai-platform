import React, { useCallback, useMemo, useState } from "react";

import PageWrapper from "../../components/layout/PageWrapper";
import ErrorState from "../../components/shared/ErrorState";
import Card from "../../components/ui/Card";
import { LoadingPanel } from "../../components/ui/Spinner";
import { TBody, TableShell, Td, Th, Tr } from "../../components/ui/DataTable";
import api from "../../api/axios";
import { useFetch } from "../../hooks/useFetch";
import { formatDateTime } from "../../utils/helpers";
import { actionLabel, actionSubject, isAlerting } from "../../utils/audit";

// Groups the action keys into the questions an administrator actually arrives
// with: who signed in, who opened patient records, what the model was asked to
// do, and what administrators changed.
const FILTERS = [
  { key: "all", label: "All", match: () => true },
  { key: "access", label: "Sign-ins", match: (a) => a.startsWith("auth.") },
  {
    key: "records",
    label: "Patient records",
    match: (a) => a.startsWith("patient.") || a.startsWith("report."),
  },
  { key: "clinical", label: "Diagnoses", match: (a) => a.startsWith("diagnosis.") },
  {
    key: "admin",
    label: "Administration",
    match: (a) => a.startsWith("admin.") || a.startsWith("access_request."),
  },
];

const SystemLogs = () => {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const fetchLogs = useCallback(
    () => api.get("/admin/logs", { params: { limit: 200 } }).then((r) => r.data ?? []),
    []
  );
  const { data, loading, error, reload: load } = useFetch(
    fetchLogs,
    [],
    "Could not load the audit log."
  );
  const logs = useMemo(() => data ?? [], [data]);

  // Filtering is client-side over the fetched window. The questions an
  // administrator brings to this page — "what did this clinician do", "who
  // opened this record" — were unanswerable when it offered no filter at all.
  const rows = useMemo(() => {
    const match = FILTERS.find((f) => f.key === filter)?.match ?? (() => true);
    const needle = query.trim().toLowerCase();
    return logs.filter((log) => {
      if (!match(log.action)) return false;
      if (!needle) return true;
      return [log.user_name, actionLabel(log.action), actionSubject(log), log.ip_address]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(needle));
    });
  }, [logs, filter, query]);

  return (
    <PageWrapper title="Audit Log">
      <p className="mb-4 max-w-prose text-sm text-gray-700">
        Records sign-ins, patient record access, diagnosis runs and administrative
        changes. Showing the 200 most recent entries, newest first.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`rounded-control border px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === f.key
                ? "border-cyprus bg-cyprus text-white"
                : "border-gray-300 bg-white text-gray-700 hover:border-accent"
            }`}
          >
            {f.label}
          </button>
        ))}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by clinician, record or address…"
          aria-label="Filter audit entries"
          className="ml-auto w-full min-w-48 rounded-control border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-500 focus:border-accent focus:outline-none sm:w-64"
        />
      </div>

      <Card padding="none">
        {loading ? (
          <LoadingPanel label="Loading audit log" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : logs.length === 0 ? (
          <p className="py-14 text-center text-sm text-gray-600">
            No activity recorded yet.
          </p>
        ) : rows.length === 0 ? (
          <p className="py-14 text-center text-sm text-gray-600">
            No entries match this filter.
          </p>
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>User</Th>
                <Th>Action</Th>
                {/* The API has always returned `details` — which patient was
                    opened, which diagnosis was downloaded, which account a
                    failed sign-in targeted — and this table dropped it. Without
                    it the log recorded that something happened but never what
                    to, which is the one question a medical audit trail exists
                    to answer. */}
                <Th>Record</Th>
                <Th>IP address</Th>
              </tr>
            </thead>
            <TBody>
              {rows.map((log, idx) => (
                <Tr key={log.id} index={idx}>
                  <Td nowrap className="tabular text-xs">
                    {formatDateTime(log.created_at)}
                  </Td>
                  {/* Resolved server-side; this column used to print a raw UUID. */}
                  <Td nowrap>{log.user_name || "System"}</Td>
                  <Td
                    nowrap
                    className={
                      isAlerting(log.action) ? "font-medium text-danger-ink" : "text-gray-900"
                    }
                  >
                    {actionLabel(log.action)}
                  </Td>
                  <Td className="font-mono text-xs text-gray-700">
                    {actionSubject(log) || "—"}
                  </Td>
                  <Td nowrap className="font-mono text-xs text-gray-600">
                    {log.ip_address || "—"}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </TableShell>
        )}
      </Card>

      {!loading && !error && logs.length > 0 && (
        <p className="tabular mt-3 text-xs text-gray-600">
          {rows.length} of {logs.length} entries shown
        </p>
      )}
    </PageWrapper>
  );
};

export default SystemLogs;
