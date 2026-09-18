import React, { useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { Activity, Inbox, Stethoscope, Users } from "lucide-react";
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
import { formatDateTime, fullStageDistribution } from "../../utils/helpers";
import { actionLabel, actionSubject, isAlerting } from "../../utils/audit";
import { DR_STAGE_CHART_COLORS, ROUTES } from "../../constants";

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

  // Memoised, and above the early returns so the hook order never changes.
  // Recharts restarts a bar's width animation whenever the data array identity
  // changes, and rebuilding it on every render could leave the bars frozen
  // part-way through — a count of 2 rendered as a 14px sliver on an axis
  // scaled at 86px per diagnosis.
  const chartData = useMemo(
    () => fullStageDistribution(data?.stats?.dr_stage_distribution),
    [data?.stats?.dr_stage_distribution]
  );
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

  const pending = stats.pending_access_requests ?? 0;

  const statCards = [
    // Pending access requests lead because they are the only figure here that
    // represents work waiting on the administrator. The rest count things that
    // already happened, and they occupied the whole row while the one
    // actionable number was reachable only by opening the nav.
    {
      label: "Pending requests",
      value: pending,
      icon: Inbox,
      tone: pending > 0 ? "bg-warning-wash text-warning-ink" : "bg-sand text-cyprus",
      to: ROUTES.ADMIN_REQUESTS,
    },
    {
      label: "Active doctors",
      value: stats.active_doctors,
      // The total is carried as a sublabel rather than as its own card: two
      // adjacent cards both reading "1" told an administrator nothing.
      sub: stats.total_doctors !== stats.active_doctors ? "of " + stats.total_doctors : null,
      icon: Stethoscope,
      tone: "bg-success-wash text-success-ink",
      to: ROUTES.ADMIN_DOCTORS,
    },
    { label: "Patients", value: stats.total_patients, icon: Users, tone: "bg-sand text-accent" },
    {
      label: "Diagnoses",
      value: stats.total_diagnoses,
      icon: Activity,
      tone: "bg-warning-wash text-warning-ink",
    },
  ];

  // All five ICDR stages in severity order, including those with no cases. The
  // endpoint GROUPs BY, so an empty stage never came back and the plot showed
  // only whichever stages happened to exist — a five-point clinical scale
  // rendered as a two-row chart, where "no proliferative cases" and "this scale
  // stops at 3" looked identical.
  const hasAnyDiagnoses = chartData.some((d) => d.value > 0);

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

      {/* Two across on a phone, matching the clinician dashboard. Stacked
          one per row, four cards holding a single number each filled an
          entire phone screen before any content began. */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {statCards.map((stat) => {
          const body = (
            <>
              <div className={`rounded-control p-2.5 ${stat.tone}`}>
                {React.createElement(stat.icon, { size: 22, "aria-hidden": "true" })}
              </div>
              <div className="min-w-0">
                <FieldLabel>{stat.label}</FieldLabel>
                <p className="tabular text-2xl font-semibold leading-tight text-gray-900">
                  {stat.value}
                  {stat.sub && (
                    <span className="ml-1.5 text-sm font-normal text-gray-600">{stat.sub}</span>
                  )}
                </p>
              </div>
            </>
          );
          // A count that corresponds to a page links through to it. Reading
          // "2 pending requests" and then hunting the nav for where they live
          // is a step this page can absorb.
          return stat.to ? (
            <Link
              key={stat.label}
              to={stat.to}
              className="flex items-center gap-3 rounded-card bg-white p-4 shadow-card transition-shadow hover:shadow-card-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:gap-4"
            >
              {body}
            </Link>
          ) : (
            <Card key={stat.label} padding="sm" className="flex items-center gap-3 sm:gap-4">
              {body}
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeading>DR stage distribution (system-wide)</CardHeading>
          {hasAnyDiagnoses ? (
            // A horizontal bar chart, not the pie this used to be. ICDR stages
            // are ordinal — 0 through 4 by severity — and a pie renders them as
            // unordered slices whose relative sizes have to be judged by angle.
            // Bars on a shared baseline keep the severity order readable down
            // the axis and make the counts directly comparable.
            <ResponsiveContainer width="100%" height={264}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 4, right: 32, bottom: 18, left: 0 }}
                barCategoryGap="22%"
              >
                <CartesianGrid horizontal={false} stroke="#E0DDD4" />
                {/* Labelled, because this axis ticks 0, 1, 2, 3, 4 — the same
                    numerals as the ICDR stages named down the other axis, with
                    nothing on the chart saying which was which. */}
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={{ stroke: "#E0DDD4" }}
                  tick={{ fontSize: 11, fill: "#4B5563" }}
                  label={{
                    value: "Diagnoses",
                    position: "insideBottom",
                    offset: -4,
                    style: { fontSize: 11, fill: "#4B5563" },
                  }}
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
                <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={26} isAnimationActive={false}>
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
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <CardHeading className="mb-0">Recent activity</CardHeading>
            <Link
              to={ROUTES.ADMIN_LOGS}
              className="rounded-sm text-xs font-medium text-accent underline-offset-2 hover:underline"
            >
              Full audit log
            </Link>
          </div>
          {logs.length === 0 ? (
            <p className="py-12 text-center text-sm text-gray-600">
              No activity recorded yet.
            </p>
          ) : (
            <ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto">
              {logs.map((log) => (
                <li key={log.id} className="flex items-start gap-2.5 py-2 first:pt-0">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${
                      isAlerting(log.action) ? "bg-danger" : "bg-accent"
                    }`}
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    {/* Was the raw key in monospace. An administrator should not
                        have to read `auth.login.failure` off their own
                        dashboard, and `details` — which names the account or
                        record involved — was discarded entirely. */}
                    <p className="truncate text-xs font-medium text-gray-900">
                      {actionLabel(log.action)}
                    </p>
                    {actionSubject(log) && (
                      <p className="truncate text-2xs text-gray-700">{actionSubject(log)}</p>
                    )}
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
