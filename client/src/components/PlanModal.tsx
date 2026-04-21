import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPlanStatus, createCheckoutSession, Plan } from '../api/billing';
import { useAuth } from '../context/AuthContext';

const APP_VERSION = '1.0.3';

const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  FREE:       { label: 'Free',       color: 'rgba(180,180,255,0.5)',  bg: 'rgba(180,180,255,0.08)', border: 'rgba(180,180,255,0.15)' },
  SOLO:       { label: 'Solo',       color: '#A78BFA',                bg: 'rgba(124,111,247,0.12)', border: 'rgba(124,111,247,0.3)'  },
  TEAM:       { label: 'Team',       color: '#F59E0B',                bg: 'rgba(245,158,11,0.1)',   border: 'rgba(245,158,11,0.3)'   },
  COMPANY:    { label: 'Company',    color: '#22C55E',                bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.3)'    },
  ENTERPRISE: { label: 'Enterprise', color: '#E879F9',                bg: 'rgba(232,121,249,0.1)', border: 'rgba(232,121,249,0.3)'  },
};

const CREATOR_TIERS = {
  growth: {
    label: 'Growth',
    price: '$49',
    period: '/mo',
    members: 'Up to 75 members',
    features: ['Unlimited teams', 'Unlimited managers', 'Weekly digest email', 'Score history & trends'],
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.3)',
  },
  team: {
    label: 'Team',
    price: '$99',
    period: '/mo',
    members: 'Up to 150 members',
    features: ['Unlimited teams', 'Unlimited managers', 'Executive dashboard', 'Company-wide analytics'],
    color: '#22C55E',
    bg: 'rgba(34,197,94,0.1)',
    border: 'rgba(34,197,94,0.3)',
  },
};

interface Props {
  onClose: () => void;
}

function TierCard({
  config,
  price,
  period,
  members,
  features,
  isCurrent,
  children,
}: {
  config: { label: string; color: string; bg: string; border: string };
  price: string;
  period: string;
  members: string;
  features: string[];
  isCurrent: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{
        border: `1px solid ${isCurrent ? config.border : 'rgba(124,111,247,0.1)'}`,
        background: isCurrent ? config.bg : 'transparent',
      }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold" style={{ color: config.color }}>{config.label}</span>
            {isCurrent && (
              <span
                className="text-xs px-1.5 py-0.5 rounded-md font-semibold"
                style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
              >
                Current
              </span>
            )}
          </div>
          <p className="text-xs text-[rgba(180,180,255,0.4)]">{members}</p>
          <div className="flex flex-wrap gap-1 pt-0.5">
            {features.map(f => (
              <span key={f} className="text-xs text-[rgba(180,180,255,0.35)]">· {f}</span>
            ))}
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-lg font-black text-white">{price}</span>
          <span className="text-xs text-[rgba(180,180,255,0.35)]">{period}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

function CreatorPlanView({ tier }: { tier: string }) {
  // DB tier='team' = Growth pricing; DB tier='enterprise' = Team pricing
  const isGrowth = tier === 'team';
  const current = isGrowth ? CREATOR_TIERS.growth : CREATOR_TIERS.team;
  const upgrade = isGrowth ? CREATOR_TIERS.team : null;

  return (
    <div className="space-y-2.5">
      <TierCard {...current} isCurrent={true} />

      {upgrade && (
        <TierCard {...upgrade} isCurrent={false}>
          <a
            href="mailto:hello@tenly.app?subject=Upgrade%20to%20Team%20plan"
            className="block w-full py-2 text-sm font-bold rounded-xl text-center transition"
            style={{ background: '#fff', color: '#000' }}
          >
            Upgrade to Team →
          </a>
        </TierCard>
      )}

      {!isGrowth && (
        <div
          className="rounded-xl p-4"
          style={{ border: '1px solid rgba(124,111,247,0.1)' }}
        >
          <p className="text-sm font-bold text-[rgba(180,180,255,0.5)] mb-1">Enterprise</p>
          <p className="text-xs text-[rgba(180,180,255,0.35)] mb-3">Custom members, dedicated support, SLA</p>
          <a
            href="mailto:hello@tenly.app?subject=Enterprise%20inquiry"
            className="block w-full py-2 text-sm font-bold rounded-xl text-center transition"
            style={{ border: '1px solid rgba(124,111,247,0.3)', color: '#A78BFA' }}
          >
            Contact us →
          </a>
        </div>
      )}
    </div>
  );
}

export default function PlanModal({ onClose }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState<'SOLO' | null>(null);

  const { data: planStatus } = useQuery({
    queryKey: ['plan-status'],
    queryFn: getPlanStatus,
  });

  const currentPlan = planStatus?.plan ?? 'FREE';
  const currentTier = planStatus?.tier ?? 'free';
  const isCreator = user?.role === 'creator';

  async function handleUpgrade(plan: 'SOLO') {
    setLoading(plan);
    try {
      const { url } = await createCheckoutSession(plan);
      window.location.href = url;
    } catch {
      setLoading(null);
      alert('Something went wrong. Please try again.');
    }
  }

  const managerTiers = [
    {
      plan: 'FREE' as Plan,
      price: '$0',
      period: 'forever',
      members: 'Up to 5 members',
      features: ['Basic dashboards', '90-day history'],
      cta: null,
    },
    {
      plan: 'SOLO' as Plan,
      price: '$15',
      period: '/mo',
      members: 'Up to 25 members',
      features: ['Full history', 'All dashboards'],
      cta: 'SOLO' as const,
    },
  ];

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-50" onClick={onClose} />

      <div className="fixed z-50 inset-x-0 bottom-0 sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4">
        <div className="bg-[#13132A] border border-[rgba(124,111,247,0.2)] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-5 space-y-5">

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-white">Your plan</h3>
              <p className="text-xs text-[rgba(180,180,255,0.35)] mt-0.5">v{APP_VERSION}</p>
            </div>
            <button
              onClick={onClose}
              className="text-[rgba(180,180,255,0.35)] hover:text-white transition text-xl leading-none"
            >
              ×
            </button>
          </div>

          {isCreator ? (
            <CreatorPlanView tier={currentTier} />
          ) : (
            <div className="space-y-2.5">
              {managerTiers.map(tier => {
                const config = PLAN_CONFIG[tier.plan];
                const isCurrent = currentPlan === tier.plan;
                const isUpgrade = tier.cta && ['FREE', 'SOLO'].includes(currentPlan) && tier.plan !== 'FREE';
                const isDowngrade = tier.plan === 'FREE' && currentPlan !== 'FREE';

                return (
                  <div
                    key={tier.plan}
                    className="rounded-xl p-4 space-y-3 transition"
                    style={{
                      border: `1px solid ${isCurrent ? config.border : 'rgba(124,111,247,0.1)'}`,
                      background: isCurrent ? config.bg : 'transparent',
                      opacity: isDowngrade ? 0.4 : 1,
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold" style={{ color: config.color }}>{config.label}</span>
                          {isCurrent && (
                            <span
                              className="text-xs px-1.5 py-0.5 rounded-md font-semibold"
                              style={{ background: config.bg, color: config.color, border: `1px solid ${config.border}` }}
                            >
                              Current
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[rgba(180,180,255,0.4)]">{tier.members}</p>
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {tier.features.map(f => (
                            <span key={f} className="text-xs text-[rgba(180,180,255,0.35)]">· {f}</span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-lg font-black text-white">{tier.price}</span>
                        <span className="text-xs text-[rgba(180,180,255,0.35)]">{tier.period}</span>
                      </div>
                    </div>

                    {tier.cta && !isCurrent && isUpgrade && (
                      <button
                        onClick={() => handleUpgrade(tier.cta!)}
                        disabled={loading !== null}
                        className="w-full py-2 text-sm font-bold rounded-xl disabled:opacity-40 transition"
                        style={{
                          background: tier.plan === 'SOLO' ? '#fff' : 'transparent',
                          color: tier.plan === 'SOLO' ? '#000' : config.color,
                          border: tier.plan === 'SOLO' ? 'none' : `1px solid ${config.border}`,
                        }}
                      >
                        {loading === tier.cta ? 'Redirecting…' : `Upgrade to ${config.label}`}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs text-center text-[rgba(180,180,255,0.2)]">
            Powered by Stripe · Cancel anytime
          </p>
        </div>
      </div>
    </>
  );
}
