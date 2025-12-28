'use client';

import { FormEvent, useState } from 'react';
import { logout, useAuthContext } from '@/app/providers';
import { setAccessToken, startOtp, verifyOtp } from '@/lib/api-client';

export default function LoginPage() {
  const { refresh, user } = useAuthContext();
  const [channel, setChannel] = useState<'phone' | 'email'>('email');
  const [contact, setContact] = useState('test@example.com');
  const [code, setCode] = useState('0000');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStart = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setMessage(null);
      await startOtp({
        channel,
        email: channel === 'email' ? contact : undefined,
        phone: channel === 'phone' ? contact : undefined,
        purpose: 'login',
      });
      setMessage('OTP started. Check your channel for the code.');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to start OTP';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setMessage(null);
      const tokens = await verifyOtp({
        channel,
        email: channel === 'email' ? contact : undefined,
        phone: channel === 'phone' ? contact : undefined,
        code,
      });
      if (tokens.accessToken) {
        setAccessToken(tokens.accessToken);
        await refresh();
        setMessage('Logged in. Session refreshed.');
      } else {
        setMessage('No accessToken returned.');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to verify OTP';
      setMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    refresh();
    setMessage('Logged out.');
  };

  return (
    <div className="mx-auto max-w-xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Login (OTP)</h1>
      {user ? <p className="text-sm text-neutral-700">Current user: {user.email}</p> : <p className="text-sm">Not logged in.</p>}

      <form onSubmit={handleStart} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex gap-2 text-sm">
          <label className="flex items-center gap-1">
            <input type="radio" value="email" checked={channel === 'email'} onChange={() => setChannel('email')} />
            Email
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" value="phone" checked={channel === 'phone'} onChange={() => setChannel('phone')} />
            Phone
          </label>
        </div>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          className="w-full rounded border px-3 py-2"
          placeholder={channel === 'email' ? 'Email' : 'Phone'}
        />
        <button type="submit" className="rounded bg-black px-4 py-2 text-white" disabled={loading}>
          {loading ? 'Sending…' : 'Start OTP'}
        </button>
      </form>

      <form onSubmit={handleVerify} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="w-full rounded border px-3 py-2"
          placeholder="OTP code"
        />
        <button type="submit" className="rounded bg-emerald-600 px-4 py-2 text-white" disabled={loading}>
          {loading ? 'Verifying…' : 'Verify & Login'}
        </button>
      </form>

      <button onClick={handleLogout} className="rounded bg-neutral-200 px-4 py-2 text-sm" disabled={loading}>
        Logout
      </button>

      {message && <div className="rounded border bg-white p-3 text-sm text-neutral-800">{message}</div>}
    </div>
  );
}
