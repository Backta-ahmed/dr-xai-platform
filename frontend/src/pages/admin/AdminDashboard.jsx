import React, { useCallback } from "react";
import { Activity, Stethoscope, UserCheck, Users } from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import PageWrapper from "../../components/layout/PageWrapper";
import ErrorState from "../../components/shared/ErrorState";
import SimulationBanner from "../../components/shared/SimulationBanner";
import api from "../../api/axios";
import { useFetch } from "../../hooks/useFetch";
import { formatDateTime } from "../../utils/helpers";
import { DR_STAGE_CHART_COLORS, DR_STAGE_NAMES } from "../../constants";

const AdminDashboard = () => {
  const fetchOverview = useCallback(async () => {
    const [statsResult, logsResult] = await Promise.allSettled([
      api.get("/admin/stats"),
      api.get("/admin/logs", { params: { limit: 10 } }),
    ]);

    if (statsResult.status === "rejected") throw statsResult.reason;

    return {
      stats: statsResult.value.data,
      // A failing log query should not blank the whole dashboard.
      logs: logsResult.status === "fulfilled" ? logsResult.value.data ?? [] : [],
    };
  }, []);

  const { data, loading, error, reload: load } = useFetch(
    fetchOverview,
    [],
    "Could not load system statistics."
  );

  const stats = data?.stats ?? null;
  const logs = data?.logs ?? [];

  if (loading) {
    return (
      <PageWrapper title="Admin Dashboard">
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

  if (error || !stats) {
    return (
      <PageWrapper title="Admin Dashboard">
        <div className="rounded-xl bg-white shadow-card">
          <ErrorState message={error || "No statistics available."} onRetry={load} />
        </div>
      </PageWrapper>
    );
  }

  const statCards = [
    { label: "Doctors", value: stats.total_doctors, icon: Stethoscope, color: "text-cyprus" },
    // Distinct from total_doctors. This card previously displayed the same
    // number as the one beside it.
    { label: "Active doctors", value: stats.active_doctors, icon: UserCheck, color: "text-success" },
    { label: "Patients", value: stats.total_patients, icon: Users, color: "text-accent" },
    { label: "Diagnoses", value: stats.total_diagnoses, icon: Activity, color: "text-warning" },
  ];

  const chartData = (stats.dr_stage_distribution ?? []).map((d) => ({
    name: DR_STAGE_NAMES[d.stage] ?? `Stage ${d.stage}`,
    value: d.count,
    stage: d.stage,
  }));

  return (
    <PageWrapper title="Admin Dashboard">
      {stats.simulated_diagnoses > 0 && (
        <div className="mb-6">
          <SimulationBanner variant="inline" />
          <p className="mt-2 text-xs text-gray-700">
            {stats.simulated_diagnoses} of {stats.total_diagnoses} recorded diagnoses
            were produced by the stub backend.
          </p>
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center space-x-4 rounded-xl bg-white p-6 shadow-card"
          >
            <div className={`rounded-lg bg-sand p-3 ${stat.color}`}>
              <stat.icon size={24} aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium uppercase tracking-wide text-gray-600">
                {stat.label}
              </p>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            DR stage distribution (system-wide)
          </h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.stage}
                      fill={DR_STAGE_CHART_COLORS[entry.stage] ?? "#9CA3AF"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-gray-600">
              No diagnoses recorded yet.
            </p>
          )}
        </div>

        <div className="rounded-xl bg-white p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Recent activity</h2>
          {logs.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-600">
              No activity recorded yet.
            </p>
          ) : (
            <ul className="max-h-64 space-y-3 overflow-y-auto">
              {logs.map((log) => (
                <li
                  key={log.id}
                  className="flex items-start gap-3 border-b border-gray-100 pb-3 text-sm last:border-0"
                >
                  <span
                    className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="font-mono text-gray-800">{log.action}</p>
                    <p className="text-xs text-gray-600">
                      {log.user_name || "System"} · {formatDateTime(log.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default AdminDashboard;
