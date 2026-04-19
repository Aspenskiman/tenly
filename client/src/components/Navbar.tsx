import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getPlanStatus } from '../api/billing';
import PlanModal from './PlanModal';

const PLAN_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  FREE:       { label: 'Free',       color: 'rgba(180,180,255,0.5)',  bg: 'rgba(180,180,255,0.08)' },
  SOLO:       { label: 'Solo',       color: '#A78BFA',                bg: 'rgba(124,111,247,0.12)' },
  TEAM:       { label: 'Team',       color: '#F59E0B',                bg: 'rgba(245,158,11,0.1)'   },
  COMPANY:    { label: 'Company',    color: '#22C55E',                bg: 'rgba(34,197,94,0.1)'    },
  ENTERPRISE: { label: 'Enterprise', color: '#E879F9',                bg: 'rgba(232,121,249,0.1)'  },
};

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPlan, setShowPlan] = useState(false);

  const { data: planStatus } = useQuery({
    queryKey: ['plan-status'],
    queryFn: getPlanStatus,
    enabled: !!user,
    staleTime: 60_000,
  });

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isManager = user?.role === 'manager';
  const plan = planStatus?.plan ?? 'FREE';
  const badge = PLAN_BADGE[plan] ?? PLAN_BADGE.FREE;

  const navLinks = isManager ? [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/roster', label: 'Roster' },
    { to: '/log', label: '+ Log' },
    { to: '/digest', label: 'Digest' },
  ] : [];

  return (
    <>
      <nav style={{
        background: '#13132A',
        borderBottom: '1px solid rgba(124,111,247,0.15)',
        padding: '0 16px',
        height: 52,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
          <Link to="/" style={{
            fontSize: 18,
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: '#A78BFA',
            textDecoration: 'none',
            fontFamily: "'DM Sans', system-ui, sans-serif",
          }}>
            tenly
          </Link>

          {isManager && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {navLinks.map(link => {
                const active = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    style={{
                      padding: '5px 12px',
                      fontSize: 13,
                      fontWeight: active ? 600 : 400,
                      borderRadius: 8,
                      textDecoration: 'none',
                      background: active ? 'rgba(124,111,247,0.15)' : 'transparent',
                      color: active ? '#A78BFA' : 'rgba(180,180,255,0.4)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'rgba(180,180,255,0.6)' }}>{user.name}</span>

            {/* Plan badge */}
            <button
              onClick={() => setShowPlan(true)}
              title={`${badge.label} plan — click to manage`}
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: badge.color,
                background: badge.bg,
                border: `1px solid ${badge.color}25`,
                borderRadius: 5,
                padding: '2px 6px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.15s',
                lineHeight: 1.6,
                opacity: 0.85,
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              {badge.label}
            </button>

            <button
              onClick={handleLogout}
              style={{
                fontSize: 12,
                color: 'rgba(180,180,255,0.35)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                fontFamily: 'inherit',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(180,180,255,0.35)')}
            >
              Sign out
            </button>
          </div>
        )}
      </nav>

      {showPlan && <PlanModal onClose={() => setShowPlan(false)} />}
    </>
  );
}
