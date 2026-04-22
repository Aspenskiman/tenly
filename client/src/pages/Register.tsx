import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { theme } from '../lib/theme';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await register({ name: name.trim(), email: email.trim(), password });
      setUser(user);
      navigate('/roster', { replace: true });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: theme.bg }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black tracking-tight mb-1" style={{ color: theme.accentLt }}>tenly</h1>
          <p className="text-sm" style={{ color: theme.textMid }}>Stop asking "How are you doing?" — start knowing.</p>
        </div>

        <div className="rounded-2xl p-8" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
          <h2 className="text-xl font-semibold text-white mb-6">Create your free account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.textMid }}>Full name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
                required
                autoComplete="name"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.textMid }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.textMid }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs mt-1" style={{ color: theme.textMute }}>Minimum 8 characters</p>
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-xl" style={{ color: '#EF4444', backgroundColor: theme.card, border: `1px solid rgba(239,68,68,0.2)` }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50"
              style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
            >
              {loading ? 'Creating account…' : 'Create free account'}
            </button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color: theme.textMid }}>
            Already have an account?{' '}
            <Link to="/login" className="font-medium hover:underline" style={{ color: theme.accentLt }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
