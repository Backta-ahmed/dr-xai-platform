export const API_BASE = "/api/v1";

export const DR_STAGES = [
  { value: 0, label: "No DR", color: "bg-green-500 text-white" },
  { value: 1, label: "Mild", color: "bg-yellow-500 text-white" },
  { value: 2, label: "Moderate", color: "bg-orange-500 text-white" },
  { value: 3, label: "Severe", color: "bg-red-500 text-white" },
  { value: 4, label: "Proliferative", color: "bg-red-800 text-white font-bold" },
];

export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  PATIENTS: "/patients",
  DIAGNOSIS: "/diagnosis",
  REPORTS: "/reports",
  PROFILE: "/profile",
  ADMIN: "/admin",
};
