// Falls back to the relative path so the dev proxy still works if no env file
// is present. A production build must set VITE_API_URL — there is no proxy
// there, and a relative path would 404 every request.
export const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

// ICDR severity scale. Index matches the backend's dr_stage.
//
// Badge colours use dark text on the light amber/orange fills. White on
// bg-yellow-500 measured about 2.0:1 and white on orange about 2.5:1, both
// well under the WCAG AA minimum of 4.5:1 — and stage severity is clinical
// information, so it must not depend on a colour the reader cannot resolve.
export const DR_STAGES = [
  { value: 0, label: "No DR", color: "bg-green-100 text-green-900 ring-1 ring-green-600/30" },
  { value: 1, label: "Mild", color: "bg-amber-100 text-amber-900 ring-1 ring-amber-600/40" },
  { value: 2, label: "Moderate", color: "bg-orange-100 text-orange-900 ring-1 ring-orange-700/40" },
  { value: 3, label: "Severe", color: "bg-red-100 text-red-900 ring-1 ring-red-700/40" },
  { value: 4, label: "Proliferative", color: "bg-red-700 text-white font-semibold" },
];

// Five distinct hues so every stage is separable in the pie chart. The previous
// palette repeated two colours, making Mild/Moderate and Severe/Proliferative
// indistinguishable from each other.
export const DR_STAGE_CHART_COLORS = [
  "#27AE60", // No DR
  "#F1C40F", // Mild
  "#E67E22", // Moderate
  "#D35400", // Severe
  "#A93226", // Proliferative
];

export const DR_STAGE_NAMES = DR_STAGES.map((s) => s.label);

export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  PATIENTS: "/patients",
  DIAGNOSIS: "/diagnosis",
  REPORTS: "/reports",
  PROFILE: "/profile",
  ADMIN: "/admin",
};
