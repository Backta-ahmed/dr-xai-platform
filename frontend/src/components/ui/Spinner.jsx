import React from "react";

/**
 * The same spinner div was duplicated nine times across the app at two
 * arbitrary sizes. One component, one set of sizes, and the accessible name
 * is no longer optional — several copies had no role or label at all.
 */
const SIZES = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-10 w-10 border-2",
};

export const Spinner = ({ size = "md", label = "Loading", className = "" }) => (
  <div
    role="status"
    aria-label={label}
    className={`animate-spin rounded-full border-b-transparent border-l-transparent border-cyprus ${
      SIZES[size] ?? SIZES.md
    } ${className}`}
  />
);

/** Centred spinner for a panel or page region that is still loading. */
export const LoadingPanel = ({ label = "Loading", className = "py-16" }) => (
  <div className={`flex justify-center ${className}`}>
    <Spinner size="lg" label={label} />
  </div>
);

export default Spinner;
