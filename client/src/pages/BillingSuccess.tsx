import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

export default function BillingSuccess() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate('/roster'), 4000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-3xl">
          ✓
        </div>
        <div className="space-y-1">
          <h1 className="text-xl font-black text-white">You're all set.</h1>
          <p className="text-sm text-[rgba(180,180,255,0.5)]">
            Your plan has been upgraded. Add as many team members as you need.
          </p>
        </div>
        <p className="text-xs text-[rgba(180,180,255,0.25)]">Redirecting to your roster…</p>
      </div>
    </Layout>
  );
}
