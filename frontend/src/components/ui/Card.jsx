import React from "react";

/**
 * Card headings had split into two competing treatments for one role —
 * `text-sm font-medium uppercase tracking-wide text-gray-600` on the diagnosis
 * result, and `text-lg font-semibold text-gray-900` everywhere else — with the
 * result being the only page using the weaker one. The most important screen in
 * the app therefore read as the least structured. One treatment, here.
 *
 * `padding="none"` exists for cards whose child is a table and must reach the
 * card's own edges.
 */
const PADDING = { none: "", sm: "p-4", md: "p-6" };

export const Card = ({ padding = "md", className = "", children, ...props }) => (
  <div
    className={`rounded-card bg-white shadow-card ${PADDING[padding] ?? PADDING.md} ${className}`}
    {...props}
  >
    {children}
  </div>
);

// `as` keeps the heading level semantic (h2 inside a page, h3 inside a section)
// without changing its appearance. createElement rather than a <Tag> element:
// the eslint config has no react plugin, so JSX-only usage of a destructured
// component reads as an unused variable.
export const CardHeading = ({ as = "h2", action, className = "", children }) => (
  <div className={`mb-4 flex items-baseline justify-between gap-4 ${className}`}>
    {React.createElement(
      as,
      { className: "text-md font-semibold text-gray-900" },
      children
    )}
    {action}
  </div>
);

/** Small uppercase label for a value inside a card — not a heading. */
export const FieldLabel = ({ className = "", children }) => (
  <span className={`block text-xs font-medium uppercase tracking-wide text-gray-600 ${className}`}>
    {children}
  </span>
);

export default Card;
