import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [siap, setSiap] = useState(!getToken());

  useEffect(() => {
    if (!getToken()) return;
    api.me().then(setUser).catch(() => setToken(null)).finally(() => setSiap(true));
  }, []);

  const value = useMemo(() => {
    const mulai = (r) => {
      setToken(r.token);
      setUser(r.user);
    };
    return {
      user,
      siap,
      masuk: (email, password) => api.login({ email, password }).then(mulai),
      daftar: (data) => api.register(data).then(mulai),
      keluar: () => mulai({ token: null, user: null }),
    };
  }, [user, siap]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
