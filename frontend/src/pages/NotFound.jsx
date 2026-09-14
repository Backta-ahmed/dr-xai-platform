import React from "react";
import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

import { ROUTES } from "../constants";
import { useAuth } from "../hooks/useAuth";

/**
 * Real 404.
 *
 * The catch-all route previously redirected to /login, which bounced a
 * signed-in doctor out of the app over a mistyped URL and made it look like
 * their session had expired.
 */
const NotFound = () => {
  const { user } = useAuth();
  const home = user
    ? user.role === "admin"
      ? ROUTES.ADMIN
      : ROUTES.DASHBOARD
    : ROUTES.LOGIN;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-sand px-6 text-center">
      <Compass size={48} className="mb-4 text-cyprus" aria-hidden="true" />
      <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
        Page not found
      </h1>
      <p className="mt-2 max-w-md text-sm text-gray-700">
        That address does not match anything in this application. It may have been
        mistyped, or the page may have moved.
      </p>
      <Link
        to={home}
        className="mt-6 rounded-lg bg-cyprus px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyprus-light"
      >
        {user ? "Back to your dashboard" : "Go to sign in"}
      </Link>
    </div>
  );
};

export default NotFound;
