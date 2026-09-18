import React, { useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, CalendarDays, Eye, Users } from "lucide-react";
import {
  Bar,
  BarChart,
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
import Button from "../../components/ui/Button";
import Card, { CardHeading, FieldLabel } from "../../components/ui/Card";
import { LoadingPanel } from "../../components/ui/Spinner";
import api from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";
import { useFetch } from "../../hooks/useFetch";
import { DR_STAGE_CHART_COLORS } from "../../constants";
import { fullStageDistribution } from "../../utils/helpers";

// Recharts renders SVG, so axis and label colours cannot come from a Tailwind
// class. These are the same greys the rest of the page uses for secondary and
// body text — no new hues.
const AXIS_INK = "#4B5563";
const LABEL_INK = "#374151";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Single call to a real endpoint. The page previously derived its numbers
  // from a patients-list request and left three cards hardcoded at zero.
  const fetchStats = useCallback(() => api.get("/stats/me").then((r) => r.data), []);
  const {
    data: stats,
    loading,
    error,
    reload: load,
  } = useFetch(fetchStats, [], "Could not load your dashboard.");

  // All five ICDR stages in severity order, including those with no cases. The
  // endpoint GROUPs BY, so an empty stage never came back and the plot silently
  // shrank to however many stages happened to exist — "no proliferative cases"
  // and "this scale stops at 3" rendered identically.
  //
  // Memoised, and above the early returns so the hook order never varies.
  // Recharts restarts a bar's width animation whenever the data array identity
  // changes, and rebuilding it every render could leave the bars frozen
  // part-way through: a count of 2 drawn as a 14px sliver on an axis scaled at
  // 86px per diagnosis.
  const chartData = useMemo(
    () => fullStageDistribution(stats?.dr_stage_distribution),
    [stats?.dr_stage_distribution]
  );

  if (loading) {
    return (
      <PageWrapper title="Dashboard">
        <LoadingPanel label="Loading your dashboard" className="py-20" />
      </PageWrapper>
    );
  }

  if (error || !stats) {
    return (
      <PageWrapper title="Dashboard">
        <Card padding="none">
          <ErrorState message={error ?? "No statistics available."} onRetry={load} />
        </Card>
      </PageWrapper>
    );
  }

  const statCards = [
    { label: "Patients", value: stats.total_patients, icon: Users, color: "text-cyprus" },
    { label: "Diagnoses", value: stats.total_diagnoses, icon: Activity, color: "text-accent" },
    { label: "Severe cases", value: stats.severe_cases, icon: AlertTriangle, color: "text-danger" },
    {
      label: "Last 30 days",
      value: stats.diagnoses_last_30_days,
      icon: CalendarDays,
      color: "text-warning",
    },
  ];

  const hasAnyDiagnoses = chartData.some((d) => d.value > 0);

  return (
    // No hardcoded "Dr." prefix: full_name often already contains a title, which
    // rendered as "Welcome, Dr. Dr Amina Belkacem".
    <PageWrapper title={`Welcome, ${user?.full_name ?? ""}`}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {stats.simulated_diagnoses > 0 && (
          <SimulationBanner variant="inline" className="min-w-0 flex-1" />
        )}
        {/* The "Quick actions" panel this replaces cost half the page for two
            links. Patients is already in the sidebar and carries its own "Add
            patient"; a new diagnosis has no other entry point from here, so it
            stays — as the page's one primary action, on one row. */}
        <Button variant="primary" className="ml-auto" onClick={() => navigate("/diagnosis/new")}>
          <Eye size={16} aria-hidden="true" />
          Run diagnosis
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} padding="sm" className="flex items-center gap-3">
            <span className={`flex-shrink-0 rounded-control bg-sand p-2 ${stat.color}`}>
              {/* createElement, not <stat.icon />: the eslint config has no react
                  plugin, so JSX-only use of a mapped component is flagged. */}
              {React.createElement(stat.icon, { size: 20, "aria-hidden": "true" })}
            </span>
            <span className="min-w-0">
              <FieldLabel>{stat.label}</FieldLabel>
              <span className="tabular block text-2xl font-semibold leading-tight text-gray-900">
                {stat.value}
              </span>
            </span>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeading as="h2">DR stage distribution</CardHeading>
        {hasAnyDiagnoses ? (
          <ResponsiveContainer width="100%" height={232}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 32, bottom: 18, left: 0 }}
              barCategoryGap="22%"
            >
              {/* Labelled, because these ticks run 0, 1, 2, 3, 4 — the same
                  numerals as the ICDR stages named down the other axis, with
                  nothing saying which axis meant which. */}
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: AXIS_INK }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: "Diagnoses",
                  position: "insideBottom",
                  offset: -4,
                  style: { fontSize: 11, fill: AXIS_INK },
                }}
              />
              {/* The stage name stays on the axis: severity is never carried by
                  the bar colour alone. */}
              <YAxis
                type="category"
                dataKey="name"
                width={104}
                tick={{ fontSize: 12, fill: LABEL_INK }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(0,71,65,0.05)" }}
                formatter={(value) => [value, "Diagnoses"]}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false} isAnimationActive={false}>
                {chartData.map((entry) => (
                  <Cell
                    key={entry.stage}
                    // Keyed by stage, not array position, so a stage with no
                    // results does not shift every colour after it.
                    fill={DR_STAGE_CHART_COLORS[entry.stage] ?? "#9CA3AF"}
                  />
                ))}
                {/* Replaces the pie's `label`: the count stays readable. */}
                <LabelList dataKey="value" position="right" fontSize={11} fill={LABEL_INK} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="py-8 text-center text-sm text-gray-600">No diagnoses recorded yet.</p>
        )}
      </Card>
    </PageWrapper>
  );
};

export default Dashboard;
