import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isManager = user?.role === 'manager';

  const navLinks = isManager ? [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/roster', label: 'Roster' },
    { to: '/log', label: '+ Log' },
    { to: '/digest', label: 'Digest' },
  ] : [];

  return (
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 12, color: 'rgba(180,180,255,0.3)' }}>{user.name}</span>
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
  );
}
