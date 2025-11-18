import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export default function LoginPage() {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login(email, password);
      window.location.href = '/dashboard';
    } catch (e) {
      setErr('Invalid credentials');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow">
        <h2 className="text-2xl font-bold text-center">Sign in to your account</h2>
        {err && <div className="text-red-600">{err}</div>}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} type="email" required
                   className="mt-1 block w-full border rounded p-2"/>
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input value={password} onChange={e => setPassword(e.target.value)} type="password" required
                   className="mt-1 block w-full border rounded p-2"/>
          </div>
          <button type="submit" className="w-full py-2 rounded bg-indigo-600 text-white font-semibold">
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
