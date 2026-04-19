import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { addMember } from '../api/teams';

export default function BillingSuccess() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'adding' | 'done' | 'error'>('adding');
  const [memberName, setMemberName] = useState<string | null>(null);

  useEffect(() => {
    async function finalize() {
      const raw = localStorage.getItem('pendingMember');
      if (raw) {
        try {
          const { teamId, name, email } = JSON.parse(raw);
          setMemberName(name);
          await addMember(teamId, { name, email });
          localStorage.removeItem('pendingMember');
          setStatus('done');
        } catch {
          setStatus('error');
        }
      } else {
        setStatus('done');
      }
    }
    finalize();
  }, []);

  useEffect(() => {
    if (status === 'done') {
      const timer = setTimeout(() => navigate('/roster'), 2500);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  return (
    <Layout>
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 flex items-center justify-center text-3xl">
          {status === 'adding' ? (
            <span className="animate-pulse text-[#22C55E] text-lg">…</span>
          ) : status === 'error' ? '⚠' : '✓'}
        </div>
        <div className="space-y-1">
          {status === 'adding' && (
            <>
              <h1 className="text-xl font-black text-white">Upgrading your plan…</h1>
              <p className="text-sm text-[rgba(180,180,255,0.5)]">Adding {memberName} to your team.</p>
            </>
          )}
          {status === 'done' && (
            <>
              <h1 className="text-xl font-black text-white">
                {memberName ? `${memberName} has been added.` : "You're all set."}
              </h1>
              <p className="text-sm text-[rgba(180,180,255,0.5)]">
                Your plan has been upgraded. Add as many team members as you need.
              </p>
            </>
          )}
          {status === 'error' && (
            <>
              <h1 className="text-xl font-black text-white">Plan upgraded.</h1>
              <p className="text-sm text-[rgba(180,180,255,0.5)]">
                Couldn't auto-add {memberName} — please add them from your roster.
              </p>
            </>
          )}
        </div>
        {status !== 'adding' && (
          <p className="text-xs text-[rgba(180,180,255,0.25)]">Redirecting to your roster…</p>
        )}
      </div>
    </Layout>
  );
}
