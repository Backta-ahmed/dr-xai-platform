import React, { useCallback } from "react";
import { Activity, Stethoscope, UserCheck, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import PageWrapper from "../../components/layout/PageWrapper";
import ErrorState from "../../components/shared/ErrorState";
import SimulationBanner from "../../components/shared/SimulationBanner";
import Card, { CardHeading, FieldLabel } from "../../components/ui/Card";
import { LoadingPanel } from "../../components/ui/Spinner";
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
        <LoadingPanel label="Loading system statistics" />
      </PageWrapper>
    );
  }

  if (error || !stats) {
    return (
      <PageWrapper title="Admin Dashboard">
        <Card padding="none">
          <ErrorState message={error || "No statistics available."} onRetry={load} />
        </Card>
      </PageWrapper>
    );
  }

  const statCards = [
    { label: "Doctors", value: stats.total_doctors, icon: Stethoscope, tone: "bg-sand text-cyprus" },
    // Distinct from total_doctors. This card previously displayed the same
    // number as the one beside it.
    {
      label: "Active doctors",
      value: stats.active_doctors,
      icon: UserCheck,
      tone: "bg-success-wash text-success-ink",
    },
    { label: "Patients", value: stats.total_patients, icon: Users, tone: "bg-sand text-accent" },
    {
      label: "Diagnoses",
      value: stats.total_diagnoses,
      icon: Activity,
      tone: "bg-warning-wash text-warning-ink",
    },
  ];

  // Sorted by stage, because the chart below reads top-to-bottom as the ICDR
  // severity scale and the endpoint does not promise an order.
  const chartData = (stats.dr_stage_distribution ?? [])
    .map((d) => ({
      name: DR_STAGE_NAMES[d.stage] ?? `Stage ${d.stage}`,
      value: d.count,
      stage: d.stage,
    }))
    .sort((a, b) => a.stage - b.stage);

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

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} padding="sm" className="flex items-center gap-4">
            <div className={`rounded-control p-2.5 ${stat.tone}`}>
              {React.createElement(stat.icon, { size: 22, "aria-hidden": "true" })}
            </div>
            <div className="min-w-0">
              <FieldLabel>{stat.label}</FieldLabel>
              <p className="tabular text-2xl font-semibold leading-tight text-gray-900">
                {stat.value}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeading>DR stage distribution (system-wide)</CardHeading>
          {chartData.length > 0 ? (
            // A horizontal bar chart, not the pie this used to be. ICDR stages
            // are ordinal — 0 through 4 by severity — and a pie renders them as
            // unordered slices whose relative sizes have to be judged by angle.
            // Bars on a shared baseline keep the severity order readable down
            // the axis and make the counts directly comparable.
            <ResponsiveContainer width="100%" height={232}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 32, bottom: 4, left: 0 }}
                barCategoryGap="22%"
              >
                <CartesianGrid horizontal={false} stroke="#E0DDD4" />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={{ stroke: "#E0DDD4" }}
                  tick={{ fontSize: 11, fill: "#4B5563" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={96}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "#374151" }}
                />
                <Tooltip
                  cursor={{ fill: "rgba(0,71,65,0.06)" }}
                  formatter={(value) => [value, "Diagnoses"]}
                  contentStyle={{
                    borderRadius: "0.5rem",
                    border: "1px solid #E0DDD4",
                    fontSize: "0.75rem",
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={26}>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.stage}
                      fill={DR_STAGE_CHART_COLORS[entry.stage] ?? "#9CA3AF"}
                    />
                  ))}
                  <LabelList
                    dataKey="value"
                    position="right"
                    style={{ fontSize: 11, fill: "#374151" }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-12 text-center text-sm text-gray-600">
              No diagnoses recorded yet.
            </p>
          )}
        </Card>

        <Card>
          <CardHeading>Recent activity</CardHeading>
          {logs.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-600">
              No activity recorded yet.
            </p>
          ) : (
            <ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto">
              {logs.map((log) => (
                <li key={log.id} className="flex items-start gap-2.5 py-2 first:pt-0">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-accent"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-mono text-xs text-gray-800">{log.action}</p>
                    <p className="text-2xs text-gray-600">
                      {log.user_name || "System"} · {formatDateTime(log.created_at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </PageWrapper>
  );
};

export default AdminDashboard;
