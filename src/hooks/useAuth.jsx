import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = async () => {
    try {
      setLoading(true);
      const session = await authService.getCurrentUser();
      if (session) {
        setUser(session.user);
        setProfile(session.profile);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.error('Error loading session:', err);
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await authService.login(email, password);
    setUser(res.user);
    setProfile(res.profile);
    return res;
  };

  const register = async (email, password, fullName) => {
    return await authService.register(email, password, fullName);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setProfile(null);
  };

  const role = profile?.role || 'user';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        loading,
        login,
        register,
        logout,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
