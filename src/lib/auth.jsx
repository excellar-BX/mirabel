/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import api from "./axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // null = still checking, true/false = known
  const [authenticated, setAuthenticated] = useState(null);

  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setAuthenticated(!!res.data.authenticated))
      .catch(() => setAuthenticated(false));

    const onExpired = () => setAuthenticated(false);
    window.addEventListener("auth:expired", onExpired);
    return () => window.removeEventListener("auth:expired", onExpired);
  }, []);

  const login = useCallback(async (password) => {
    await api.post("/auth/login", { password });
    setAuthenticated(true);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setAuthenticated(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ authenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function RequireAdmin({ children }) {
  const { authenticated } = useAuth();
  const location = useLocation();

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-app flex items-center justify-center text-subtle">
        <Loader2 className="animate-spin" size={24} />
      </div>
    );
  }
  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return children;
}
