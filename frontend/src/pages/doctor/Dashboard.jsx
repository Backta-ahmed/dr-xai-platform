import React, { useEffect, useState } from "react";
import PageWrapper from "../../components/layout/PageWrapper";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/axios";
import DRStageBadge from "../../components/shared/DRStageBadge";
import { formatDate } from "../../utils/helpers";
import { useNavigate, Link } from "react-router-dom";
import { Users, Activity, AlertTriangle, CalendarDays, PlusCircle, Eye } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const CHART_COLORS = ["#27AE60", "#E67E22", "#E67E22", "#C0392B", "#C0392B"];

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total_patients: 0, total_diagnoses: 0, dr_stage_distribution: [] });
  const [recentDiagnoses, setRecentDiagnoses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes] = await Promise.all([
          api.get("/patients/?page=1&limit=5"),
        ]);
        
        // Build local stats from patients
        setStats(prev => ({
          ...prev,
          total_patients: patientsRes.data.total || 0,
        }));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: "Total Patients", value: stats.total_patients, icon: Users, color: "text-cyprus" },
    { label: "Total Diagnoses", value: stats.total_diagnoses, icon: Activity, color: "text-accent" },
    { label: "Severe Cases", value: stats.dr_stage_distribution?.filter(d => d.stage >= 3).reduce((a,b) => a + b.count, 0) || 0, icon: AlertTriangle, color: "text-danger" },
    { label: "This Month", value: "—", icon: CalendarDays, color: "text-warning" },
  ];

  const chartData = stats.dr_stage_distribution?.map(d => ({
    name: ["No DR","Mild","Moderate","Severe","Proliferative"][d.stage] || `Stage ${d.stage}`,
    value: d.count
  })) || [];

  if (loading) {
    return (
      <PageWrapper title="Dashboard">
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyprus"></div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title={`Welcome, Dr. ${user?.full_name}`}>
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
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => navigate("/patients/new")}
              className="flex items-center px-4 py-3 bg-cyprus text-white rounded-lg hover:bg-cyprus-light transition-colors"
            >
              <PlusCircle size={20} className="mr-3" /> New Patient
            </button>
            <button
              onClick={() => navigate("/diagnosis/new")}
              className="flex items-center px-4 py-3 bg-accent text-white rounded-lg hover:bg-accent/90 transition-colors"
            >
              <Eye size={20} className="mr-3" /> Run Diagnosis
            </button>
          </div>
        </div>

        {/* DR Stage Distribution Chart */}
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">DR Stage Distribution</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-8">No diagnosis data yet</p>
          )}
        </div>
      </div>
    </PageWrapper>
  );
};

export default Dashboard;
