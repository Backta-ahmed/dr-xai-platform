import React, { useCallback } from "react";

import PageWrapper from "../../components/layout/PageWrapper";
import ErrorState from "../../components/shared/ErrorState";
import Card from "../../components/ui/Card";
import { LoadingPanel } from "../../components/ui/Spinner";
import { TBody, TableShell, Td, Th, Tr } from "../../components/ui/DataTable";
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
      <p className="mb-4 max-w-prose text-sm text-gray-700">
        Records sign-ins, patient record access, diagnosis runs and administrative
        changes. Showing the 100 most recent entries, newest first.
      </p>

      <Card padding="none">
        {loading ? (
          <LoadingPanel label="Loading audit log" />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : logs.length === 0 ? (
          <p className="py-14 text-center text-sm text-gray-600">
            No activity recorded yet.
          </p>
        ) : (
          <TableShell>
            <thead>
              <tr>
                <Th>When</Th>
                <Th>User</Th>
                <Th>Action</Th>
                <Th>IP address</Th>
              </tr>
            </thead>
            <TBody>
              {logs.map((log, idx) => (
                <Tr key={log.id} index={idx}>
                  <Td nowrap className="tabular text-xs">
                    {formatDateTime(log.created_at)}
                  </Td>
                  {/* Resolved server-side; this column used to print a raw UUID. */}
                  <Td nowrap>{log.user_name || "System"}</Td>
                  <Td className="font-mono text-xs text-gray-900">{log.action}</Td>
                  <Td nowrap className="font-mono text-xs text-gray-600">
                    {log.ip_address || "—"}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </TableShell>
        )}
      </Card>
    </PageWrapper>
  );
};

export default SystemLogs;
