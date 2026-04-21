import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { theme } from '../lib/theme';

export default function CreatorDashboard() {
  const { user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', background: theme.bg }}>
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-1">
            Welcome, {user?.name}
          </h1>
          <p className="text-sm" style={{ color: theme.textMid }}>
            {user?.companyName ?? 'Your company'}
          </p>
        </div>

        {/* Team card */}
        <div
          className="rounded-2xl p-6 mb-4"
          style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Your Team</h2>
            <span
              className="text-xs px-2 py-0.5 rounded-md font-semibold"
              style={{ backgroundColor: `${theme.accent}20`, color: theme.accentLt, border: `1px solid ${theme.accent}40` }}
            >
              Manager
            </span>
          </div>
          <p className="text-sm" style={{ color: theme.textMid }}>
            No members yet. Invite a manager to get started.
          </p>
        </div>

        {/* Invite button stub */}
        <button
          disabled
          className="w-full py-2.5 rounded-xl font-semibold text-sm opacity-50 cursor-not-allowed"
          style={{ backgroundColor: theme.accent, color: '#fff' }}
        >
          Invite a Manager (coming soon)
        </button>
      </div>
    </div>
  );
}
