import { DR_STAGES, DR_STAGE_NAMES } from "../constants";

/** Date only. Returns an em dash for missing or unparseable values. */
export const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

/** Date and time, for the audit log where ordering within a day matters. */
export const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

/**
 * Age in whole years. Clinicians think in age, not birth date — "12 Apr 1968"
 * makes the reader do arithmetic on a screen where they are already doing
 * clinical work.
 */
export const age = (value) => {
  if (!value) return null;
  const born = new Date(value);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let years = now.getFullYear() - born.getFullYear();
  const monthDelta = now.getMonth() - born.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getDate() < born.getDate())) years -= 1;
  return years >= 0 && years < 150 ? years : null;
};

export const drStageColor = (stageValue) => {
  const stage = DR_STAGES.find((s) => s.value === stageValue);
  return stage ? stage.color : "bg-gray-200 text-gray-900";
};

export const drStageLabel = (stageValue) => {
  const stage = DR_STAGES.find((s) => s.value === stageValue);
  return stage ? stage.label : "Unknown";
};

/**
 * The five ICDR stages in order, with a zero for any stage the API omitted.
 *
 * `/admin/stats` and `/stats/me` GROUP BY, so a stage with no diagnoses is
 * absent from the response and vanished from the chart. That left a plot of
 * two bars for a five-point clinical scale, where "no proliferative cases" and
 * "this scale has no stage 4" looked exactly the same.
 */
export const fullStageDistribution = (raw) => {
  const counts = new Map((raw ?? []).map((d) => [d.stage, d.count]));
  return DR_STAGES.map((s) => ({
    stage: s.value,
    name: DR_STAGE_NAMES[s.value] ?? `Stage ${s.value}`,
    value: counts.get(s.value) ?? 0,
  }));
};

/** Diabetes type as a clinician writes it, from the stored enum value. */
export const diabetesType = (value) => {
  if (!value) return "—";
  const map = { type1: "Type 1", type2: "Type 2", gestational: "Gestational", other: "Other" };
  return map[value] ?? value;
};
