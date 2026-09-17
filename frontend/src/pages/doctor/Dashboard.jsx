import React, { useCallback } from "react";
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
import { DR_STAGE_CHART_COLORS, DR_STAGE_NAMES } from "../../constants";

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

  // Sorted by stage, not by count: the ICDR scale is ordinal, so the reading
  // order of the chart has to be 0 → 4 regardless of how the endpoint returns
  // the rows. The bar chart replaces a pie, which had no ordering at all and
  // made two adjacent severities a matter of comparing wedge angles.
  const chartData = (stats.dr_stage_distribution ?? [])
    .map((d) => ({
      name: DR_STAGE_NAMES[d.stage] ?? `Stage ${d.stage}`,
      value: d.count,
      stage: d.stage,
    }))
    .sort((a, b) => a.stage - b.stage);

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
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={196}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 32, bottom: 0, left: 0 }}
              barCategoryGap="22%"
            >
              <XAxis
                type="number"
                allowDecimals={false}
                tick={{ fontSize: 11, fill: AXIS_INK }}
                axisLine={false}
                tickLine={false}
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
              <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
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
