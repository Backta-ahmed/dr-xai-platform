import { DR_STAGES } from "../constants";

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

export const drStageColor = (stageValue) => {
  const stage = DR_STAGES.find((s) => s.value === stageValue);
  return stage ? stage.color : "bg-gray-200 text-gray-900";
};

export const drStageLabel = (stageValue) => {
  const stage = DR_STAGES.find((s) => s.value === stageValue);
  return stage ? stage.label : "Unknown";
};
