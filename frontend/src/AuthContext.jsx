import { createContext, useContext, useEffect, useState } from 'react';
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

  async function masuk(email, password) {
    const r = await api.login({ email, password });
    setToken(r.token);
    setUser(r.user);
  }
  async function daftar(data) {
    const r = await api.register(data);
    setToken(r.token);
    setUser(r.user);
  }
  function keluar() {
    setToken(null);
    setUser(null);
  }

  return <Ctx.Provider value={{ user, siap, masuk, daftar, keluar }}>{children}</Ctx.Provider>;
}
