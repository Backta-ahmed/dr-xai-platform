import React, { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, AlertTriangle, CalendarDays, Eye, PlusCircle, Users } from "lucide-react";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import PageWrapper from "../../components/layout/PageWrapper";
import ErrorState from "../../components/shared/ErrorState";
import SimulationBanner from "../../components/shared/SimulationBanner";
import api from "../../api/axios";
import { useAuth } from "../../hooks/useAuth";
import { useFetch } from "../../hooks/useFetch";
import { DR_STAGE_CHART_COLORS, DR_STAGE_NAMES } from "../../constants";

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
      <PageWrapper title="Dashboard">
        <div className="rounded-xl bg-white shadow-card">
          <ErrorState message={error ?? "No statistics available."} onRetry={load} />
        </div>
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

  const chartData = (stats.dr_stage_distribution ?? []).map((d) => ({
    name: DR_STAGE_NAMES[d.stage] ?? `Stage ${d.stage}`,
    value: d.count,
    stage: d.stage,
  }));

  return (
    <PageWrapper title={`Welcome, Dr. ${user?.full_name ?? ""}`}>
      {stats.simulated_diagnoses > 0 && <SimulationBanner variant="inline" className="mb-6" />}

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
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Quick actions</h2>
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => navigate("/patients/new")}
              className="flex items-center rounded-lg bg-cyprus px-4 py-3 text-white transition-colors hover:bg-cyprus-light"
            >
              <PlusCircle size={20} className="mr-3" aria-hidden="true" /> New patient
            </button>
            <button
              onClick={() => navigate("/diagnosis/new")}
              className="flex items-center rounded-lg bg-accent px-4 py-3 text-white transition-colors hover:bg-accent/90"
            >
              <Eye size={20} className="mr-3" aria-hidden="true" /> Run diagnosis
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">DR stage distribution</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  {chartData.map((entry) => (
                    <Cell
                      key={entry.stage}
                      // Keyed by stage, not array position, so a stage with no
                      // results does not shift every colour after it.
                      fill={DR_STAGE_CHART_COLORS[entry.stage] ?? "#9CA3AF"}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-gray-600">
              No diagnoses recorded yet.
            </p>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
