import React from "react";

/**
 * Table shells for record lists.
 *
 * Rows are ~44px (py-2.5), not the previous ~56px (py-4), and pages now show 25
 * rows instead of 10 — roughly 2.5x more records visible without scrolling.
 * This is a records tool: a clinician scanning a patient list wants to see the
 * list, not to page through it.
 *
 * TableShell owns the horizontal scroll container, so a wide table scrolls
 * inside its own bounds and the page body never scrolls sideways.
 */
export const TableShell = ({ children, className = "" }) => (
  <div className={`overflow-x-auto ${className}`}>
    <table className="min-w-full divide-y divide-gray-200">{children}</table>
  </div>
);

export const Th = ({ align = "left", className = "", children, ...props }) => (
  <th
    scope="col"
    className={`whitespace-nowrap bg-sand px-5 py-2.5 text-${align} text-2xs font-semibold uppercase tracking-wide text-gray-700 ${className}`}
    {...props}
  >
    {children}
  </th>
);

export const Td = ({ nowrap = false, className = "", children, ...props }) => (
  <td
    className={`px-5 py-2.5 text-sm text-gray-700 ${nowrap ? "whitespace-nowrap" : ""} ${className}`}
    {...props}
  >
    {children}
  </td>
);

/** Zebra striping applied from one place so rows cannot drift between tables. */
export const Tr = ({ index = 0, className = "", children, ...props }) => (
  <tr
    className={`${index % 2 === 0 ? "bg-white" : "bg-sand-light"} ${className}`}
    {...props}
  >
    {children}
  </tr>
);

export const TBody = ({ children }) => (
  <tbody className="divide-y divide-gray-100">{children}</tbody>
);

/** Rows per page for every record list. */
export const PAGE_SIZE = 25;

export default TableShell;
