import React, { createContext, useState, useEffect } from 'react';
import { login as apiLogin, logout as apiLogout } from '../API/auth';
import api, { setAccessToken } from '../API/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // attempt to refresh token on startup
  useEffect(() => {
    async function init() {
      try {
        const resp = await api.post('/auth/refresh'); // will set accessToken via api interceptor logic? adjust
        const accessToken = resp.data.accessToken;
        setAccessToken(accessToken);
        const me = await api.get('/auth/me');
        setUser(me.data);
      } catch {
        setUser(null);
      }
    }
    init();
  }, []);

  const login = async (email, password) => {
    const me = await apiLogin(email, password);
    setUser(me);
    return me;
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
