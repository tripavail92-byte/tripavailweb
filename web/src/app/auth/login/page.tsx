'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout, useAuthContext } from '@/app/providers';
import { setAccessToken, startOtp, verifyOtp } from '@/lib/api-client';

export default function LoginPage() {
  const router = useRouter();
  const { refresh, user } = useAuthContext();
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4100';
  const [channel, setChannel] = useState<'phone' | 'email'>('email');
  const [contact, setContact] = useState('test@example.com');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const redirecting = useRef(false);

  // If already logged in, quietly send the user away so the OTP UI stops appearing post-login
  useEffect(() => {
    if (user && !redirecting.current) {
      redirecting.current = true;
      router.replace('/traveler/discovery');
    }
  }, [user, router]);

  if (user) {
    return null;
  }

  const handleStart = async (event: FormEvent) => {
    event.preventDefault();
    try {
      setLoading(true);
      setMessage(null);
      setCode('');

      console.log('Calling startOtp...');
      const response = await startOtp({
        channel,
        email: channel === 'email' ? contact : undefined,
        phone: channel === 'phone' ? contact : undefined,
        purpose: 'login',
      });

      console.log('Response received:', response);
      console.log('Response type:', typeof response);
      console.log('Response is object?', typeof response === 'object');

      if (!response) {
        setMessage('ERROR: No response received from backend');
        return;
      }

      const codeValue = response.code;
      console.log('Code value:', codeValue);

      if (codeValue) {
        setCode(codeValue);
        setMessage(`✓ CODE: ${codeValue}`);
      } else {
        // If no code, show the full response so we can debug
        const responseStr = JSON.stringify(response);
        console.log('Full response string:', responseStr);
        setMessage(`Response has no code property. Full response: ${responseStr}`);
      }
    } catch (err) {
      console.error('Error in handleStart:', err);
      const msg = err instanceof Error ? err.message : 'Failed to start OTP';
      setMessage(`ERROR: ${msg}`);
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
        setMessage('Logged in. Redirecting...');
        // Redirect to home after a brief delay
        setTimeout(() => router.push('/'), 500);
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
      <p className="text-sm">Not logged in.</p>
      <p className="text-xs text-neutral-500">API base: {apiBaseUrl}</p>

      <form onSubmit={handleStart} className="space-y-3 rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex gap-2 text-sm">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              value="email"
              checked={channel === 'email'}
              onChange={() => setChannel('email')}
            />
            Email
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              value="phone"
              checked={channel === 'phone'}
              onChange={() => setChannel('phone')}
            />
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
        <button
          type="submit"
          className="rounded bg-emerald-600 px-4 py-2 text-white"
          disabled={loading}
        >
          {loading ? 'Verifying…' : 'Verify & Login'}
        </button>
      </form>

      <button
        onClick={handleLogout}
        className="rounded bg-neutral-200 px-4 py-2 text-sm"
        disabled={loading}
      >
        Logout
      </button>

      {message && (
        <div className="rounded border bg-white p-3 text-sm text-neutral-800">{message}</div>
      )}
    </div>
  );
}
