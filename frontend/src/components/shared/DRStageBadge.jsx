import React from "react";
import { drStageColor, drStageLabel } from "../../utils/helpers";

const DRStageBadge = ({ stage }) => {
  const colorClass = drStageColor(stage);
  const label = drStageLabel(stage);

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
    >
      {label}
    </span>
  );
};

export default DRStageBadge;
