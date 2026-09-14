import React, { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import Sidebar from "./Sidebar";

const PageWrapper = ({ children, title }) => {
  const [navOpen, setNavOpen] = useState(false);

  // Escape closes the mobile drawer — without it, keyboard users who open the
  // drawer have no way to dismiss it.
  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (e) => {
      if (e.key === "Escape") setNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navOpen]);

  return (
    <div className="min-h-screen bg-sand">
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />

      {/* Offset matches the sidebar's 240px exactly. The previous ml-64 (256px)
          left a 16px gutter that did not line up with anything. */}
      <div className="lg:ml-60">
        <div className="flex items-center gap-3 px-4 pt-6 sm:px-6 lg:px-8">
          <button
            onClick={() => setNavOpen(true)}
            className="rounded-lg border border-gray-300 bg-white p-2 text-gray-700 transition-colors hover:bg-gray-50 lg:hidden"
            aria-label="Open navigation"
            aria-expanded={navOpen}
          >
            <Menu size={20} />
          </button>
          {title && (
            <h1 className="truncate text-xl font-semibold tracking-tight text-gray-900 sm:text-2xl">
              {title}
            </h1>
          )}
        </div>

        <main className="px-4 pb-10 pt-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
};

export default PageWrapper;
