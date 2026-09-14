import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

/**
 * Inline failure state with a retry.
 *
 * Every page previously handled a failed request with console.error alone, so
 * a network error left the user staring at a spinner or an empty table with no
 * explanation and no way forward.
 */
const ErrorState = ({ message, onRetry, className = "" }) => (
  <div className={`flex flex-col items-center justify-center px-6 py-14 text-center ${className}`}>
    <AlertCircle size={32} className="mb-3 text-danger" aria-hidden="true" />
    <p className="text-sm font-medium text-gray-900">Could not load this data</p>
    <p className="mt-1 max-w-md text-sm text-gray-600">{message}</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
      >
        <RefreshCw size={15} aria-hidden="true" />
        Try again
      </button>
    )}
  </div>
);

export default ErrorState;
