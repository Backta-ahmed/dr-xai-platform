import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { ROUTES } from "../../constants";

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-sand">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyprus"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }

  if (role && role !== "any" && user.role !== role) {
    return <Navigate to={user.role === "admin" ? ROUTES.ADMIN : ROUTES.DASHBOARD} replace />;
  }

  return children;
};

export default ProtectedRoute;
