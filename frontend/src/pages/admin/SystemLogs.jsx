import React, { useEffect, useState } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import api from "../../api/axios";
import { formatDate } from "../../utils/helpers";

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/logs?limit=50").then((res) => {
      setLogs(res.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <PageWrapper title="System Logs">
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-cyprus"></div>
          </div>
        ) : logs.length === 0 ? (
          <p className="text-gray-400 text-center py-16">No system logs recorded yet</p>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-sand">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map((log, idx) => (
                <tr key={log.id} className={idx % 2 === 0 ? "bg-white" : "bg-sand-light"}>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(log.created_at)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{log.user_id || "System"}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{log.action}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{log.ip_address || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </PageWrapper>
  );
};

export default SystemLogs;
