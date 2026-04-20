import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { theme } from '../lib/theme';

export default function Login() {
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
      const user = await login(email, password);
      setUser(user);
      navigate(user.role === 'executive' ? '/executive' : '/dashboard');
    } catch {
      setError('Invalid email or password.');
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
          <h2 className="text-xl font-semibold text-white mb-6">Sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: theme.textMid }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
                style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
                required
                autoComplete="current-password"
              />
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
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color: theme.textMid }}>
            No account?{' '}
            <Link to="/register" className="font-medium hover:underline" style={{ color: theme.accentLt }}>
              Register your team
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: theme.textMute }}>
          Demo: manager1@acme.com / password · exec@acme.com / password
        </p>
      </div>
    </div>
  );
}
