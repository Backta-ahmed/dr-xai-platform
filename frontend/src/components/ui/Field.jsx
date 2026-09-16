import React, { useId } from "react";

/**
 * The same input class string was copy-pasted into four files and diverged in a
 * fifth. It also sat at rounded-md while the submit button beside it sat at
 * rounded-lg, so every form in the app had mismatched corners.
 *
 * Field owns the label/control/error relationship too: the generated id wires
 * htmlFor, aria-describedby and aria-invalid, which the hand-rolled versions
 * mostly skipped.
 */
export const controlClass =
  "block w-full rounded-control border border-gray-300 bg-white px-3 py-2 text-sm " +
  "shadow-sm transition-colors placeholder:text-gray-500 " +
  "focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent " +
  "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-600";

const errorClass = "border-danger focus:border-danger focus:ring-danger";

const Field = ({
  label,
  error,
  hint,
  required = false,
  children,
  className = "",
}) => {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy = [error ? errorId : null, hint ? hintId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div className="mt-1">
        {children({
          id,
          className: `${controlClass} ${error ? errorClass : ""}`,
          "aria-invalid": error ? true : undefined,
          "aria-describedby": describedBy || undefined,
          required,
        })}
      </div>

      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-gray-600">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  );
};

export default Field;
