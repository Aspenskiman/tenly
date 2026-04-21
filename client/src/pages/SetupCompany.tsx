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
    id: 'growth',
    name: 'Growth',
    price: '$49',
    priceNote: '/month',
    limit: 'Up to 75 members',
    features: ['Unlimited teams', 'Unlimited managers', 'Weekly digest email', 'Score history & trends'],
  },
  {
    id: 'team',
    name: 'Team',
    price: '$99',
    priceNote: '/month',
    limit: 'Up to 150 members',
    features: ['Unlimited teams', 'Unlimited managers', 'Executive dashboard', 'Company-wide analytics'],
  },
];

export default function SetupCompany() {
  const navigate = useNavigate();
  const [selectedTier, setSelectedTier] = useState<PreAuthTier>('growth');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleContinue() {
    setError('');
    setLoading(true);
    try {
      const { url } = await createPreAuthCheckoutSession(selectedTier);
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

        {error && (
          <p className="text-sm px-3 py-2 rounded-xl mb-3" style={{ color: '#EF4444', backgroundColor: theme.card, border: `1px solid rgba(239,68,68,0.2)` }}>
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
  );
}
