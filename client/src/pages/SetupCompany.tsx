import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../lib/theme';
import { createPreAuthCheckoutSession, PreAuthTier } from '../api/stripe';

const TIERS: {
  id: PreAuthTier;
  name: string;
  price: string;
  priceNote: string;
  limit: string;
  features: string[];
}[] = [
  {
    id: 'team',
    name: 'Team',
    price: '$40',
    priceNote: '/month',
    limit: 'Up to 150 members',
    features: ['Unlimited team members', 'Weekly digest email', 'Score history & trends'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$75',
    priceNote: '/month',
    limit: 'Up to 500 members',
    features: ['Everything in Team', 'Executive dashboard', 'Company-wide analytics'],
  },
];

export default function SetupCompany() {
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState<PreAuthTier>('team');
  const [companyName, setCompanyName] = useState('');
  const [teamName, setTeamName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleContinue() {
    if (!companyName.trim() || !teamName.trim()) {
      setError('Please fill in both Company Name and Team Name.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { url } = await createPreAuthCheckoutSession(selectedTier, companyName.trim(), teamName.trim());
      window.location.href = url;
    } catch {
      setError('Failed to start checkout. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: theme.bg }}>
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/login')}
            className="text-xs mb-4 inline-block"
            style={{ color: theme.textMute }}
          >
            ← Back to sign in
          </button>
          <h1 className="text-4xl font-black tracking-tight mb-1" style={{ color: theme.accentLt }}>tenly</h1>
          <p className="text-sm" style={{ color: theme.textMid }}>Choose a plan to get started.</p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {TIERS.map(tier => {
            const selected = selectedTier === tier.id;
            return (
              <button
                key={tier.id}
                onClick={() => setSelectedTier(tier.id)}
                className="text-left rounded-2xl p-5 transition-all"
                style={{
                  backgroundColor: theme.surface,
                  border: `2px solid ${selected ? theme.accent : theme.border}`,
                  boxShadow: selected ? `0 0 20px ${theme.accent}30` : 'none',
                }}
              >
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: selected ? theme.accentLt : theme.textMute }}>
                  {tier.name}
                </p>
                <div className="flex items-baseline gap-0.5 mb-1">
                  <span className="text-3xl font-black text-white">{tier.price}</span>
                  <span className="text-sm" style={{ color: theme.textMid }}>{tier.priceNote}</span>
                </div>
                <p className="text-xs mb-3" style={{ color: theme.textMute }}>{tier.limit}</p>
                <ul className="space-y-1">
                  {tier.features.map(f => (
                    <li key={f} className="text-xs flex items-start gap-1.5" style={{ color: theme.textMid }}>
                      <span style={{ color: theme.accent }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
              </button>
            );
          })}
        </div>

        {/* Inputs */}
        <div className="rounded-2xl p-6 space-y-4" style={{ backgroundColor: theme.surface, border: `1px solid ${theme.border}` }}>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.textMid }}>Company Name</label>
            <input
              type="text"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
              placeholder="Acme Corp"
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: theme.textMid }}>Your Team Name</label>
            <input
              type="text"
              value={teamName}
              onChange={e => setTeamName(e.target.value)}
              placeholder="Product Team"
              className="w-full px-3 py-2.5 rounded-xl text-white text-sm focus:outline-none"
              style={{ backgroundColor: theme.card, border: `1px solid ${theme.border}` }}
            />
          </div>

          {error && (
            <p className="text-sm px-3 py-2 rounded-xl" style={{ color: '#EF4444', backgroundColor: theme.card, border: `1px solid rgba(239,68,68,0.2)` }}>
              {error}
            </p>
          )}

          <button
            onClick={handleContinue}
            disabled={loading}
            className="w-full py-2.5 rounded-xl font-semibold text-sm transition disabled:opacity-50"
            style={{ backgroundColor: theme.accent, color: '#FFFFFF' }}
          >
            {loading ? 'Redirecting to payment…' : 'Continue to Payment →'}
          </button>
        </div>
      </div>
    </div>
  );
}
