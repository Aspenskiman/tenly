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
    <nav className="bg-[#111113] border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link to="/" className="text-xl font-black text-white tracking-tight">
          tenly
        </Link>
        {isManager && (
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                  location.pathname === link.to
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-500 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-600 hidden sm:block">{user.name}</span>
          <button
            onClick={handleLogout}
            className="text-xs text-zinc-500 hover:text-white transition"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
