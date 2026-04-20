import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api/auth';
import { useAuth } from '../context/AuthContext';

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
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#0A0A0B' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white tracking-tight mb-1">tenly</h1>
          <p className="text-sm" style={{ color: '#71717A' }}>Stop asking "How are you doing?" — start knowing.</p>
        </div>

        <div className="rounded-2xl p-8" style={{ backgroundColor: '#111113', border: '1px solid #27272C' }}>
          <h2 className="text-xl font-semibold text-white mb-6">Sign in</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#A1A1AA' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white"
                style={{ backgroundColor: '#1F1F23', border: '1px solid #27272C' }}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: '#A1A1AA' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-white"
                style={{ backgroundColor: '#1F1F23', border: '1px solid #27272C' }}
                required
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="text-sm px-3 py-2 rounded-lg" style={{ color: '#EF4444', backgroundColor: '#1F1F23' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-medium text-sm transition disabled:opacity-50"
              style={{ backgroundColor: '#FFFFFF', color: '#0A0A0B' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-sm mt-4" style={{ color: '#71717A' }}>
            No account?{' '}
            <Link to="/register" className="text-white hover:underline font-medium">
              Register your team
            </Link>
          </p>
        </div>

        <p className="text-center text-xs mt-6" style={{ color: '#3F3F46' }}>
          Demo: manager1@acme.com / password · exec@acme.com / password
        </p>
      </div>
    </div>
  );
}
