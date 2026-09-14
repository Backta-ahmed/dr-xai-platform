import React, { useCallback } from "react";

import PageWrapper from "../../components/layout/PageWrapper";
import ErrorState from "../../components/shared/ErrorState";
import api from "../../api/axios";
import { useFetch } from "../../hooks/useFetch";
import { formatDateTime } from "../../utils/helpers";

const SystemLogs = () => {
  const fetchLogs = useCallback(
    () => api.get("/admin/logs", { params: { limit: 100 } }).then((r) => r.data ?? []),
    []
  );
  const { data, loading, error, reload: load } = useFetch(
    fetchLogs,
    [],
    "Could not load the audit log."
  );
  const logs = data ?? [];

  return (
    <PageWrapper title="Audit Log">
      <p className="mb-4 text-sm text-gray-700">
        Records sign-ins, patient record access, diagnosis runs and administrative
        changes.
      </p>

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
        ) : logs.length === 0 ? (
          <p className="py-16 text-center text-sm text-gray-600">
            No activity recorded yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-sand">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">When</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-700">IP address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log, idx) => (
                  <tr key={log.id} className={idx % 2 === 0 ? "bg-white" : "bg-sand-light"}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {formatDateTime(log.created_at)}
                    </td>
                    {/* Resolved server-side; this column used to print a raw UUID. */}
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                      {log.user_name || "System"}
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-gray-900">{log.action}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                      {log.ip_address || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default SystemLogs;
