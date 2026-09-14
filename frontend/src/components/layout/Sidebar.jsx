import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ROUTES } from "../../constants";
import { useAuth } from "../../hooks/useAuth";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  UserCircle, 
  LogOut,
  Eye,
  Settings
} from "lucide-react";

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const doctorLinks = [
    { name: "Dashboard", path: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { name: "Patients", path: ROUTES.PATIENTS, icon: Users },
    { name: "Reports", path: ROUTES.REPORTS, icon: FileText },
    { name: "Profile", path: ROUTES.PROFILE, icon: UserCircle },
  ];

  const adminLinks = [
    { name: "Admin Dashboard", path: ROUTES.ADMIN, icon: LayoutDashboard },
    { name: "Manage Doctors", path: ROUTES.ADMIN + "/doctors", icon: Users },
    { name: "System Logs", path: ROUTES.ADMIN + "/logs", icon: FileText },
    { name: "AI Model", path: ROUTES.ADMIN + "/ai-model", icon: Settings },
  ];

  const links = user?.role === "admin" ? adminLinks : doctorLinks;

  return (
    <div className="flex flex-col w-[240px] bg-cyprus text-white h-screen fixed top-0 left-0">
      <div className="flex items-center justify-center h-20 border-b border-cyprus-light px-4">
        <Eye className="mr-3" size={28} />
        <h1 className="text-xl font-semibold tracking-tight">DR Platform</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {links.map((link) => {
            const isActive = location.pathname.startsWith(link.path) && 
                             (link.path !== ROUTES.ADMIN || location.pathname === ROUTES.ADMIN) &&
                             (link.path !== ROUTES.DASHBOARD || location.pathname === ROUTES.DASHBOARD);
            const Icon = link.icon;
            
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                  isActive 
                    ? "bg-cyprus-light text-white" 
                    : "text-gray-300 hover:bg-cyprus-light/50 hover:text-white"
                }`}
              >
                <Icon 
                  className={`flex-shrink-0 mr-3 h-5 w-5 ${isActive ? "text-accent" : "text-gray-400 group-hover:text-gray-300"}`} 
                  aria-hidden="true" 
                />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </div>
      
      <div className="flex-shrink-0 flex border-t border-cyprus-light p-4">
        <div className="flex-shrink-0 w-full group block">
          <div className="flex items-center">
            <div className="inline-block h-9 w-9 rounded-full bg-accent flex items-center justify-center text-white font-bold">
              {user?.full_name?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{user?.full_name}</p>
              <button 
                onClick={logout}
                className="text-xs font-medium text-gray-300 group-hover:text-white flex items-center mt-1"
              >
                <LogOut size={12} className="mr-1" /> Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
