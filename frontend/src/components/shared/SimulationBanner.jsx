import React from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Shown wherever simulated results are displayed.
 *
 * No diagnostic model is connected yet, so every result the platform produces
 * is a placeholder. Anyone looking at this screen — a supervisor, a clinician,
 * someone at a demo — must be able to tell that at a glance, without needing
 * context from whoever is driving.
 *
 * `variant="inline"` is the compact form for table headers and list pages.
 */
const SimulationBanner = ({ variant = "full", className = "" }) => {
  if (variant === "inline") {
    return (
      <div
        role="status"
        className={`flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 ${className}`}
      >
        <AlertTriangle size={14} className="flex-shrink-0" aria-hidden="true" />
        <span>
          Results below are <strong>simulated</strong> — no diagnostic model is connected.
        </span>
      </div>
    );
  }

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border-2 border-red-300 bg-red-50 p-4 ${className}`}
    >
      <AlertTriangle
        size={22}
        className="mt-0.5 flex-shrink-0 text-red-700"
        aria-hidden="true"
      />
      <div>
        <p className="text-sm font-semibold tracking-wide text-red-900">
          SIMULATED RESULT — NOT A MEDICAL DIAGNOSIS
        </p>
        <p className="mt-1 text-sm leading-relaxed text-red-800">
          No diagnostic model is connected to this platform. The stage and confidence
          shown below are randomly generated placeholders used to demonstrate the
          interface. They bear no relationship to the uploaded image and must not
          inform patient care.
        </p>
      </div>
    </div>
  );
};

export default SimulationBanner;
