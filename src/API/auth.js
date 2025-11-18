import api, { setAccessToken, clearAccessToken } from './api';

export async function login(email, password) {
  const res = await api.post('/auth/login', { email, password });
  setAccessToken(res.data.accessToken);
  // server set refresh cookie
  const me = await api.get('/auth/me');
  return me.data;
}

export async function logout() {
  await api.post('/auth/logout');
  clearAccessToken();
  // delete cookie handled by server or client; redirect
}
