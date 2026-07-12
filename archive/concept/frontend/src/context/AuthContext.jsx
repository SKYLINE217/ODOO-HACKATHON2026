/**
 * context/AuthContext.jsx — Authentication state management
 *
 * Implements the auth flow from authentication-signin.md §6:
 * - Token stored in sessionStorage (not localStorage — security requirement)
 * - On app load: reads token → calls GET /auth/me → restores session
 * - login(): POST /auth/login → store token + user
 * - logout(): clear sessionStorage + context, redirect to /login
 * - All protected routes depend on this context
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // On mount: restore session from sessionStorage token
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    authApi.me()
      .then(userData => {
        setUser(userData);
      })
      .catch(() => {
        // Expired or invalid token — clear and show login
        sessionStorage.removeItem('token');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    const data = await authApi.login(email, password);
    // data.token + data.user per authentication-signin.md §3
    sessionStorage.setItem('token', data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('token');
    setUser(null);
    window.location.href = '/login';
  }, []);

  const value = { user, loading, error, login, logout };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
