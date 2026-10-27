import { useEffect, useRef, useState } from 'react';
import { login, microsoftPoll, microsoftStart } from '../api';
import { CREATE_ACCOUNT_URL, RESET_PASSWORD_URL } from '../data';
import logoUrl from '../assets/logo.png';

interface LoginScreenProps {
  onAuthed: (username: string) => void;
}

export default function LoginScreen({ onAuthed }: LoginScreenProps) {
  const [mode, setMode] = useState<'offline' | 'online'>('offline');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Microsoft authorization-code flow state
  const [msVerificationUri, setMsVerificationUri] = useState<string | null>(null);
  const [msWaiting, setMsWaiting] = useState(false);
  const [msExpiresAt, setMsExpiresAt] = useState<number | null>(null);
  const [msUserCode, setMsUserCode] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => () => stopPolling(), []);

  const submitAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const res = await login(username, password, 'login');
    setBusy(false);
    if (!res) {
      setError('Cannot reach the launcher backend — start python_launcher/launcher.py');
    } else if (res.ok && res.username) {
      onAuthed(res.username);
    } else {
      setError(res.error || 'Login failed');
    }
  };

  const startMicrosoft = async () => {
    setError(null);
    setBusy(true);
    stopPolling();
    const res = await microsoftStart();
    setBusy(false);
    if (!res || !res.ok) {
      setError(res?.error || 'Cannot reach the launcher backend — start python_launcher/launcher.py');
      return;
    }
    setMsVerificationUri(res.verification_uri ?? null);
    setMsUserCode(res.user_code ?? null);
    setMsWaiting(true);
    setMsExpiresAt(Date.now() + (res.expires_in ?? 900) * 1000);
    // Microsoft asks for polling no faster than every `interval` seconds.
    const ms = Math.max(3, res.interval ?? 5) * 1000;
    pollRef.current = setInterval(async () => {
      const poll = await microsoftPoll();
      if (!poll) return; // transient — keep polling
      if (poll.status === 'authorized' && poll.username) {
        stopPolling();
        setMsWaiting(false);
        onAuthed(poll.username);
      } else if (poll.status === 'expired') {
        stopPolling();
        setMsWaiting(false);
        setMsVerificationUri(null);
        setError('The sign-in expired — press LOGIN WITH MICROSOFT to try again.');
      } else if (poll.status === 'error') {
        stopPolling();
        setMsWaiting(false);
        setMsVerificationUri(null);
        setError(poll.error || 'Microsoft sign-in failed — try again.');
      }
    }, ms);
  };

  const cancelMicrosoft = () => {
    stopPolling();
    setMsWaiting(false);
    setMsVerificationUri(null);
    setMsUserCode(null);
    setError(null);
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-logo">
          <img src={logoUrl} alt="Flame Client" />
        </div>
        <h1 className="login-title">Flame Client</h1>
        <p className="login-sub">Launch Minecraft, your way</p>

        <div className="login-tabs">
          <button
            type="button"
            className={mode === 'offline' ? 'active' : ''}
            onClick={() => {
              setMode('offline');
              setError(null);
            }}
          >
            Offline Mode
          </button>
          <button
            type="button"
            className={mode === 'online' ? 'active' : ''}
            onClick={() => {
              setMode('online');
              setError(null);
            }}
          >
            Online Mode
          </button>
        </div>

        {mode === 'offline' ? (
          <form onSubmit={submitAccount}>
            <div className="login-field">
              <span>Email / Username</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username / Microsoft email"
                autoFocus
                autoComplete="username"
              />
            </div>
            <div className="login-field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your FlameClient password"
                autoComplete="current-password"
              />
            </div>

            {error && <div className="login-error">{error}</div>}

            <button className="login-submit" type="submit" disabled={busy || !username || !password}>
              {busy ? 'Please wait…' : 'LOGIN'}
            </button>
            <p className="login-note">
              Don't have an account?{' '}
              {/* Opens in the system browser: pywebview hands every
                  target="_blank" link to webbrowser.open, so the website
                  never replaces the launcher window. */}
              <a
                className="login-link"
                href={CREATE_ACCOUNT_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Create one from the FlameClient website
              </a>
            </p>
            <p className="login-note">
              Forgot your password?{' '}
              <a
                className="login-link"
                href={RESET_PASSWORD_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                Reset it on the website
              </a>
            </p>
          </form>
        ) : (
          <div className="login-online">
            {!msWaiting ? (
              <>
                <p className="login-online-hint">
                  Sign in with your own Microsoft account to play online on real
                  servers with your Minecraft skin.
                </p>
                {error && <div className="login-error">{error}</div>}
                <button
                  className="login-submit login-ms"
                  type="button"
                  onClick={startMicrosoft}
                  disabled={busy}
                >
                  {busy ? 'Please wait…' : 'LOGIN WITH MICROSOFT'}
                </button>
              </>
            ) : (
              <>
                <div className="ms-code-box">
                  <span className="ms-code-label">Enter this code on Microsoft</span>
                  {msUserCode && <div className="ms-user-code">{msUserCode}</div>}
                  <p className="ms-wait-text">
                    Sign in with the Microsoft account that owns Minecraft: Java
                    Edition. The launcher finishes automatically — no URL copying.
                  </p>
                  {msVerificationUri && (
                    <button
                      className="login-submit login-ms"
                      type="button"
                      onClick={() => window.open(msVerificationUri, '_blank')}
                    >
                      OPEN MICROSOFT SIGN-IN PAGE
                    </button>
                  )}
                </div>
                {msExpiresAt && (
                  <p className="login-note">
                    Waiting for your code… session expires{' '}
                    {new Date(msExpiresAt).toLocaleTimeString()}. The launcher
                    opens the dashboard automatically once you're signed in.
                  </p>
                )}
                {error && <div className="login-error">{error}</div>}
                <button className="login-cancel" type="button" onClick={cancelMicrosoft}>
                  Cancel
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
