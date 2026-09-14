import { DR_STAGES } from "../constants";

export const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

export const drStageColor = (stageValue) => {
  const stage = DR_STAGES.find((s) => s.value === stageValue);
  return stage ? stage.color : "bg-gray-200 text-gray-800";
};

export const drStageLabel = (stageValue) => {
  const stage = DR_STAGES.find((s) => s.value === stageValue);
  return stage ? stage.label : "Unknown";
};
