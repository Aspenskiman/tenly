import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2">
        <span className="text-2xl font-black text-tenly-600 tracking-tight">tenly</span>
        <span className="text-xs text-gray-400 font-medium hidden sm:block">
          Stop asking "How are you doing?"
        </span>
      </Link>

      {user && (
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600 hidden sm:block">
            {user.name}
            <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-tenly-100 text-tenly-700 font-medium">
              {user.role}
            </span>
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-gray-900 transition"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
