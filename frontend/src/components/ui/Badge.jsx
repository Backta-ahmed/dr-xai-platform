import React from "react";

/**
 * There were three badge treatments for one role: DRStageBadge, a hand-rolled
 * duplicate in ManageDoctors, and a third variant in AIModel. This is the one.
 *
 * Every tone pairs a wash surface with dark ink. Solid --color-success and
 * --color-warning measure ~2.9:1 under white text, so a badge that carried
 * clinical meaning was unreadable for exactly the stages a clinician most needs
 * to distinguish.
 */
const TONES = {
  neutral: "bg-gray-100 text-gray-800 ring-gray-400/30",
  success: "bg-success-wash text-success-ink ring-success/30",
  warning: "bg-warning-wash text-warning-ink ring-warning/40",
  danger: "bg-danger-wash text-danger-ink ring-danger/40",
  critical: "bg-danger text-white ring-danger",
  accent: "bg-accent/10 text-cyprus ring-accent/30",
};

const SIZES = {
  sm: "px-1.5 py-0.5 text-2xs",
  md: "px-2.5 py-0.5 text-xs",
};

const Badge = ({
  tone = "neutral",
  size = "md",
  className = "",
  children,
  ...props
}) => (
  <span
    className={`inline-flex items-center rounded-full font-medium ring-1 ring-inset ${
      TONES[tone] ?? TONES.neutral
    } ${SIZES[size] ?? SIZES.md} ${className}`}
    {...props}
  >
    {children}
  </span>
);

export default Badge;
