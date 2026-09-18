import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Eye,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
  UserCheck,
  UserCircle,
  X,
} from "lucide-react";

import { ROUTES } from "../../constants";
import { useAuth } from "../../hooks/useAuth";

const DOCTOR_LINKS = [
  { name: "Dashboard", path: ROUTES.DASHBOARD, icon: LayoutDashboard, exact: true },
  { name: "Patients", path: ROUTES.PATIENTS, icon: Users },
  { name: "Reports", path: ROUTES.REPORTS, icon: FileText },
  { name: "Profile", path: ROUTES.PROFILE, icon: UserCircle },
];

const ADMIN_LINKS = [
  { name: "Admin Dashboard", path: ROUTES.ADMIN, icon: LayoutDashboard, exact: true },
  { name: "Manage Doctors", path: `${ROUTES.ADMIN}/doctors`, icon: Users },
  { name: "Access Requests", path: `${ROUTES.ADMIN}/requests`, icon: UserCheck },
  { name: "Audit Log", path: `${ROUTES.ADMIN}/logs`, icon: FileText },
  { name: "AI Model", path: `${ROUTES.ADMIN}/ai-model`, icon: Settings },
];

const Sidebar = ({ open = false, onClose = () => {} }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const links = user?.role === "admin" ? ADMIN_LINKS : DOCTOR_LINKS;

  const isActive = (link) =>
    link.exact
      ? location.pathname === link.path
      : location.pathname.startsWith(link.path);

  return (
    <>
      {/* Scrim for the mobile drawer. Hidden from assistive tech; Escape and
          the close button provide the accessible paths out. */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        // Off-canvas below lg, pinned open from lg up. Width is 240px here and
        // PageWrapper offsets by exactly the same amount.
        className={`fixed left-0 top-0 z-40 flex h-screen w-60 flex-col bg-cyprus text-white transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main navigation"
      >
        <div className="flex h-20 flex-shrink-0 items-center justify-between border-b border-cyprus-light px-4">
          <div className="flex items-center">
            <Eye className="mr-3" size={26} aria-hidden="true" />
            <span className="text-lg font-semibold tracking-tight">DR-XAI Platform</span>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-300 hover:bg-cyprus-light hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
          {links.map((link) => {
            const active = isActive(link);
            const Icon = link.icon;
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`group flex items-center rounded-control py-2.5 pr-3 text-sm font-medium transition-colors ${
                  active
                    ? "border-l-[3px] border-accent bg-cyprus-light pl-[9px] text-white"
                    : "border-l-[3px] border-transparent pl-[9px] text-gray-200 hover:bg-cyprus-light/50 hover:text-white"
                }`}
              >
                {/* White, not text-accent: #00736B on bg-cyprus-light measures
                    ~1.4:1, so the active-nav indicator was effectively invisible.
                    The active state is carried by the lighter background and the
                    left rule below instead. */}
                <Icon
                  className={`mr-3 h-5 w-5 flex-shrink-0 ${
                    active ? "text-white" : "text-gray-300"
                  }`}
                  aria-hidden="true"
                />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="flex-shrink-0 border-t border-cyprus-light p-4">
          <div className="flex items-center">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-accent font-bold text-white">
              {user?.full_name?.charAt(0).toUpperCase() ?? "?"}
            </div>
            <div className="ml-3 min-w-0">
              <p className="truncate text-sm font-medium text-white">{user?.full_name}</p>
              <button
                onClick={logout}
                className="mt-1 flex items-center text-xs font-medium text-gray-300 transition-colors hover:text-white"
              >
                <LogOut size={12} className="mr-1" aria-hidden="true" /> Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
