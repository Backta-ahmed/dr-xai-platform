import React, { useCallback, useEffect, useRef } from "react";
import { X } from "lucide-react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog.
 *
 * The previous inline modal had no Escape handler, no click-outside, no focus
 * trap and no aria-modal, so a keyboard user could tab out of it into the page
 * behind and had no way to dismiss it without a mouse.
 */
const Modal = ({ open, onClose, title, children, labelledBy = "modal-title" }) => {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;

      // Cycle focus within the dialog.
      const items = Array.from(panelRef.current.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );
      if (items.length === 0) return;

      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;

    previouslyFocused.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // Move focus into the dialog so screen readers announce it and Tab starts
    // from inside rather than at the top of the page.
    const firstField = panelRef.current?.querySelector(FOCUSABLE);
    firstField?.focus();

    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={(e) => {
        // Only dismiss on a press that starts on the backdrop, so a drag that
        // ends outside the panel does not close it mid-edit.
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleKeyDown}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-8 shadow-modal"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
        >
          <X size={20} />
        </button>
        <h2 id={labelledBy} className="mb-6 pr-8 text-lg font-semibold text-gray-900">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
};

export default Modal;
