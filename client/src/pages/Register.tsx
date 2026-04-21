import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { theme } from '../lib/theme';
import { fetchPreAuthSession, PreAuthSession } from '../api/stripe';
import { registerCreator } from '../api/auth';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const sessionId = searchParams.get('session_id');

  const [session, setSession] = useState<PreAuthSession | null>(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (!sessionId) {
      navigate('/setup-company', { replace: true });
      return;
    }

    const controller = new AbortController();

    fetchPreAuthSession(sessionId)
      .then(data => {
        if (controller.signal.aborted) return;
        if (!data.paid) {
          setSessionError('Payment not confirmed. Please complete checkout first.');
        } else {
          setSession(data);
          if (data.customerEmail) setEmail(data.customerEmail);
        }
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setSessionError('Could not load your session. Try again or contact support.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setSessionLoading(false);
      });

    return () => controller.abort();
  }, [sessionId, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSubmitError('');
    setSubmitting(true);

    try {
      const result = await registerCreator({
        name: name.trim(),
        email: email.trim(),
        password,
        companyName: companyName.trim(),
        teamName: teamName.trim(),
        sessionId: sessionId!,
      });
      setUser(result.user);
      navigate('/creator-dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setSubmitError(msg ?? 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: theme.bg }}>
        <p className="text-sm animate-pulse" style={{ color: theme.textMid }}>Loading your session…</p>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: theme.bg }}>
        <div className="w-full max-w-md text-center space-y-4">
          <h1 className="text-2xl font-black text-white">Payment not confirmed</h1>
          <p className="text-sm" style={{ color: theme.textMid }}>{sessionError}</p>
          <button
            onClick={() => navigate('/setup-company')}
            className="px-6 py-2.5 rounded-xl font-semibold text-sm"
            style={{ backgroundColor: theme.accent, color: '#fff' }}
          >
            Back to Plans
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
          <p className="text-sm" style={{ color: theme.textMid }}>Payment confirmed. Create your account.</p>
        </div>

        {/* Tier badge */}
        <div className="flex justify-center mb-5">
          <span
            className="text-xs font-bold px-3 py-1 rounded-full capitalize"
            style={{ backgroundColor: `${theme.accent}20`, color: theme.accentLt, border: `1px solid ${theme.accent}40` }}
          >
            {session?.tier} plan
          </span>
        </div>

        <div className="rounded-2xl p-8" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
          <h2 className="text-xl font-semibold text-white mb-6">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="creator-company" className="block text-sm font-medium mb-1" style={{ color: theme.textMid }}>Company Name</label>
              <input
                id="creator-company"
                type="text"
                autoComplete="organization"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                required
                placeholder="Acme Corp"
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
              />
            </div>

            <div>
              <label htmlFor="creator-team" className="block text-sm font-medium mb-1" style={{ color: theme.textMid }}>Your Team Name</label>
              <input
                id="creator-team"
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                required
                placeholder="Product Team"
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
              />
            </div>

            <div>
              <label htmlFor="creator-name" className="block text-sm font-medium mb-1" style={{ color: theme.textMid }}>Your Name</label>
              <input
                id="creator-name"
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
              <label htmlFor="creator-email" className="block text-sm font-medium mb-1" style={{ color: theme.textMid }}>Work Email</label>
              <input
                id="creator-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
              />
            </div>

            <div>
              <label htmlFor="creator-password" className="block text-sm font-medium mb-1" style={{ color: theme.textMid }}>Password</label>
              <input
                id="creator-password"
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
              {submitting ? 'Creating account…' : 'Create account →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
