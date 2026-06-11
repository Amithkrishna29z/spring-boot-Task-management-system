import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  login as loginApi,
  register as registerApi,
  refreshSession,
  logout as logoutApi,
} from "../services/api";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

// only username/role here, never the token — just enough to render the UI on reload.
// the httpOnly cookies are the real source of truth.
const STORED_USER_KEY = "user";

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(STORED_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  // true until we've checked for an existing session, so routes don't flash login first
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const persistUser = useCallback((value) => {
    setUser(value);
    if (value) {
      localStorage.setItem(STORED_USER_KEY, JSON.stringify(value));
    } else {
      localStorage.removeItem(STORED_USER_KEY);
    }
  }, []);

  // on load, restore the session via the refresh cookie — but only if we look logged in,
  // otherwise it's a guaranteed 401 for anonymous visitors
  useEffect(() => {
    let cancelled = false;
    const restore = async () => {
      if (!readStoredUser()) {
        setIsBootstrapping(false);
        return;
      }
      try {
        const { data } = await refreshSession();
        if (!cancelled) persistUser({ username: data.username, role: data.role });
      } catch {
        if (!cancelled) persistUser(null);
      } finally {
        if (!cancelled) setIsBootstrapping(false);
      }
    };
    restore();
    return () => {
      cancelled = true;
    };
  }, [persistUser]);

  // api.jsx fires this when a silent refresh fails mid-session
  useEffect(() => {
    const onExpired = () => persistUser(null);
    window.addEventListener("auth:session-expired", onExpired);
    return () => window.removeEventListener("auth:session-expired", onExpired);
  }, [persistUser]);

  const login = async (username, password) => {
    const { data } = await loginApi(username, password);
    persistUser({ username: data.username, role: data.role });
    return data;
  };

  const register = async (username, password) => {
    const { data } = await registerApi(username, password);
    return data;
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // best effort — clear local state even if the logout call fails
    }
    persistUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isBootstrapping,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
