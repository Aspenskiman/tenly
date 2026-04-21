import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { theme } from '../lib/theme';
import { getInvite, acceptInvite, InviteInfo } from '../api/invites';
import { useAuth } from '../context/AuthContext';

export default function InviteAccept() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!token) return;
    const controller = new AbortController();
    getInvite(token)
      .then(data => {
        if (controller.signal.aborted) return;
        setInvite(data);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setLoadError('This invite link is invalid or has already been used.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    setSubmitError('');
    setSubmitting(true);
    try {
      const result = await acceptInvite(token, name.trim(), password);
      setUser(result.user);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setSubmitError(msg ?? 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.bg }}>
        <p className="text-sm animate-pulse" style={{ color: theme.textMid }}>Loading invitation…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: theme.bg }}>
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-black text-white">Invalid invite</h1>
          <p className="text-sm" style={{ color: theme.textMid }}>{loadError}</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: theme.accent, color: '#fff' }}
          >
            Go to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: theme.bg }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tight mb-1" style={{ color: theme.accentLt }}>tenly</h1>
          <p className="text-sm" style={{ color: theme.textMid }}>
            {invite?.inviterName} invited you to join <strong style={{ color: 'white' }}>{invite?.companyName}</strong>
          </p>
        </div>

        {invite?.teamName && (
          <div className="flex justify-center mb-5">
            <span
              className="text-xs font-semibold px-3 py-1 rounded-full"
              style={{ backgroundColor: `${theme.accent}20`, color: theme.accentLt, border: `1px solid ${theme.accent}40` }}
            >
              Team: {invite.teamName}
            </span>
          </div>
        )}

        <div className="rounded-2xl p-8" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
          <h2 className="text-xl font-semibold text-white mb-1">Create your account</h2>
          <p className="text-xs mb-6" style={{ color: theme.textMute }}>
            Signing up as <strong style={{ color: 'white' }}>{invite?.email}</strong>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="invite-name" className="block text-sm font-medium mb-1" style={{ color: theme.textMid }}>
                Your Name
              </label>
              <input
                id="invite-name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
              />
            </div>

            <div>
              <label htmlFor="invite-password" className="block text-sm font-medium mb-1" style={{ color: theme.textMid }}>
                Password
              </label>
              <input
                id="invite-password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
              />
              <p className="text-xs mt-1" style={{ color: theme.textMute }}>Minimum 8 characters</p>
            </div>

            {submitError && (
              <p className="text-sm px-3 py-2 rounded-xl" style={{ color: '#EF4444', backgroundColor: theme.card, border: `1px solid rgba(239,68,68,0.2)` }}>
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50"
              style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
            >
              {submitting ? 'Creating account…' : 'Accept invite →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
