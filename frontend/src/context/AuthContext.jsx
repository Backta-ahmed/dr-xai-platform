import React, { useCallback, useEffect, useState } from "react";
import api from "../api/axios";
import { ROUTES } from "../constants";
import { AuthContext } from "./authContextValue";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("access_token");
      if (token) {
        try {
          const response = await api.get("/auth/me");
          setUser(response.data);
        } catch {
          // Token is expired or invalid; drop it and fall through to login.
          localStorage.removeItem("access_token");
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const login = async (email, password) => {
    // The backend uses OAuth2PasswordRequestForm, which requires form encoding
    // and the field name "username" even though the value is an email.
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await api.post("/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    localStorage.setItem("access_token", response.data.access_token);
    setUser(response.data.user);
    return response.data.user;
  };

  /**
   * Re-read the current user from the server.
   *
   * Needed after a profile edit: without it the sidebar keeps rendering the
   * old name until a full page reload.
   */
  const refreshUser = useCallback(async () => {
    const response = await api.get("/auth/me");
    setUser(response.data);
    return response.data;
  }, []);

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Logout is best-effort: the token is discarded locally regardless.
    }
    localStorage.removeItem("access_token");
    setUser(null);
    window.location.href = ROUTES.LOGIN;
  };

  // Render a spinner rather than nothing during the initial token check —
  // `{!loading && children}` showed a blank white page on every cold load.
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sand">
        <div
          role="status"
          aria-label="Loading"
          className="h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-cyprus"
        />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
