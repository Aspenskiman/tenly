import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface Props {
  children: React.ReactNode;
  role?: 'manager' | 'executive' | 'creator';
}

export default function ProtectedRoute({ children, role }: Props) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-tenly-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const hasAccess = !role
    || user.role === role
    || (role === 'manager' && user.role === 'creator')
    || (role === 'creator' && user.role === 'creator');

  if (!hasAccess) {
    if (user.role === 'executive') return <Navigate to="/executive" replace />;
    if (user.role === 'creator') return <Navigate to="/creator-dashboard" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
