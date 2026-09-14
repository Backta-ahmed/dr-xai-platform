import React, { useEffect, useState } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import api from "../../api/axios";
import { Users, Activity, Stethoscope, UserCheck } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { formatDate } from "../../utils/helpers";

const CHART_COLORS = ["#27AE60", "#E67E22", "#E67E22", "#C0392B", "#C0392B"];

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, logsRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/logs?limit=10"),
        ]);
        setStats(statsRes.data);
        setLogs(logsRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <PageWrapper title="Admin Dashboard">
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyprus"></div>
        </div>
      </PageWrapper>
    );
  }

  const statCards = [
    { label: "Total Doctors", value: stats?.total_doctors || 0, icon: Stethoscope, color: "text-cyprus" },
    { label: "Total Patients", value: stats?.total_patients || 0, icon: Users, color: "text-accent" },
    { label: "Total Diagnoses", value: stats?.total_diagnoses || 0, icon: Activity, color: "text-warning" },
    { label: "Active Users", value: stats?.total_doctors || 0, icon: UserCheck, color: "text-success" },
  ];

  const chartData = stats?.dr_stage_distribution?.map(d => ({
    name: ["No DR","Mild","Moderate","Severe","Proliferative"][d.stage] || `Stage ${d.stage}`,
    value: d.count
  })) || [];

  return (
    <PageWrapper title="Admin Dashboard">
      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-card p-6 flex items-center space-x-4 transition-transform hover:scale-[1.02]">
            <div className={`p-3 rounded-lg bg-sand ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">{stat.label}</p>
              <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* DR Distribution Chart */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">DR Stage Distribution (System)</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">No diagnosis data yet</p>
          )}
        </div>

        {/* Recent Logs */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          {logs.length === 0 ? (
            <p className="text-gray-400 text-center py-12">No activity logs</p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {logs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 text-sm border-b border-gray-100 pb-3">
                  <div className="w-2 h-2 rounded-full bg-accent mt-1.5 flex-shrink-0"></div>
                  <div>
                    <p className="text-gray-700">{log.action}</p>
                    <p className="text-gray-400 text-xs">{formatDate(log.created_at)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default AdminDashboard;
