import { useState } from 'react';
import { createCheckoutSession } from '../api/billing';

interface Props {
  onClose: () => void;
}

export default function UpgradeModal({ onClose }: Props) {
  const [loading, setLoading] = useState<'SOLO' | 'TEAM' | null>(null);

  async function handleUpgrade(plan: 'SOLO' | 'TEAM') {
    setLoading(plan);
    try {
      const { url } = await createCheckoutSession(plan);
      window.location.href = url;
    } catch {
      setLoading(null);
      alert('Something went wrong. Please try again.');
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-[#13132A] border border-[rgba(124,111,247,0.2)] rounded-2xl w-full max-w-sm p-6 space-y-5">

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white">Your team is growing.</h3>
            <button
              onClick={onClose}
              className="text-[rgba(180,180,255,0.35)] hover:text-white transition text-lg leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-[rgba(180,180,255,0.5)]">
            Free plan supports up to 4 team members. Upgrade to add more.
          </p>
        </div>

        {/* Plans */}
        <div className="space-y-3">

          {/* Solo */}
          <div className="border border-[rgba(124,111,247,0.25)] rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">Solo</p>
                <p className="text-xs text-[rgba(180,180,255,0.4)]">Unlimited team members · Full history</p>
              </div>
              <p className="text-lg font-black text-white">$12<span className="text-xs font-normal text-[rgba(180,180,255,0.4)]">/mo</span></p>
            </div>
            <button
              onClick={() => handleUpgrade('SOLO')}
              disabled={loading !== null}
              className="w-full py-2.5 text-sm bg-white text-black font-bold rounded-xl hover:bg-zinc-200 disabled:opacity-40 transition"
            >
              {loading === 'SOLO' ? 'Redirecting…' : 'Upgrade to Solo'}
            </button>
          </div>

          {/* Team */}
          <div className="border border-[rgba(124,111,247,0.12)] rounded-xl p-4 space-y-2 opacity-80">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">Team</p>
                <p className="text-xs text-[rgba(180,180,255,0.4)]">2–15 leaders · Executive dashboard</p>
              </div>
              <p className="text-lg font-black text-white">$14<span className="text-xs font-normal text-[rgba(180,180,255,0.4)]">/mgr/mo</span></p>
            </div>
            <button
              onClick={() => handleUpgrade('TEAM')}
              disabled={loading !== null}
              className="w-full py-2.5 text-sm border border-[rgba(124,111,247,0.2)] text-[rgba(180,180,255,0.6)] font-semibold rounded-xl hover:border-zinc-500 hover:text-white disabled:opacity-40 transition"
            >
              {loading === 'TEAM' ? 'Redirecting…' : 'Upgrade to Team'}
            </button>
          </div>
        </div>

        <p className="text-xs text-center text-[rgba(180,180,255,0.25)]">
          Powered by Stripe · Cancel anytime
        </p>
      </div>
    </div>
  );
}
