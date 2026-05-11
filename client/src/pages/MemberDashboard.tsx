import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import { getMemberEntries, getMyTeams, getTeamSummary, HappinessEntry } from '../api/teams';
import {
  scoreColor, trendArrow, trendColor, scoreZoneLabel, formatDate, formatDateLong,
} from '../lib/scores';

type Range = '4w' | '8w' | '12w' | '16w';
const RANGES: { label: string; value: Range; weeks: number; days: number }[] = [
  { label: '4w',  value: '4w',  weeks: 4,  days: 35  },
  { label: '8w',  value: '8w',  weeks: 8,  days: 63  },
  { label: '12w', value: '12w', weeks: 12, days: 91  },
  { label: '16w', value: '16w', weeks: 16, days: 119 },
];

function formatFullDate(dateStr: string): string {
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

function MemberChart({ entries, avg, color, weeks }: {
  entries: HappinessEntry[];
  avg: number | null;
  color: string;
  weeks: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    function build() {
      if (cancelled || !canvasRef.current) return;

      function dateToDays(dateStr: string): number {
        const [y, m, d] = dateStr.split('-').map(Number);
        return Math.floor(Date.UTC(y, m - 1, d) / 86400000);
      }
      function isoWeekStartDays(days: number): number {
        const dow = new Date(days * 86400000).getUTCDay();
        return days - (dow === 0 ? 6 : dow - 1);
      }
      function fmtDays(days: number): string {
        return new Date(days * 86400000).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', timeZone: 'UTC',
        });
      }

      const todayDays = Math.floor(Date.now() / 86400000);
      const cutoffDays = todayDays - weeks * 7;

      const weekStarts: number[] = [];
      let ws = isoWeekStartDays(cutoffDays);
      if (ws < cutoffDays) ws += 7;
      while (ws <= todayDays) { weekStarts.push(ws); ws += 7; }

      const memberData = entries
        .filter(e => dateToDays(e.interaction_date.slice(0, 10)) > cutoffDays)
        .sort((a, b) => a.interaction_date.localeCompare(b.interaction_date))
        .map(e => ({ x: dateToDays(e.interaction_date.slice(0, 10)), y: e.score, notes: e.notes }));

      const datasets: any[] = [
        {
          data: memberData,
          borderColor: color,
          backgroundColor: color + '20',
          borderWidth: 2,
          tension: 0,
          pointRadius: 3,
          pointHoverRadius: 5,
          spanGaps: false,
          fill: true,
          order: 0,
        },
      ];

      if (avg !== null) {
        datasets.push({
          data: [{ x: cutoffDays, y: avg }, { x: todayDays, y: avg }],
          borderColor: '#52525b',
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderDash: [4, 4],
          pointRadius: 0,
          pointHoverRadius: 0,
          spanGaps: true,
          fill: false,
          order: 1,
        });
      }

      chartRef.current?.destroy();
      chartRef.current = null;

      const C = (window as any).Chart;
      if (!C) return;

      chartRef.current = new C(canvasRef.current, {
        type: 'line',
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'nearest', intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#13132A',
              borderColor: 'rgba(124,111,247,0.2)',
              borderWidth: 1,
              titleColor: 'rgba(180,180,255,0.5)',
              bodyColor: '#fff',
              padding: 10,
              filter: (item: any) => item.datasetIndex === 0,
              callbacks: {
                title: (items: any[]) => items.length ? fmtDays(items[0].parsed.x) : '',
                label: (item: any) => {
                  const pt = item.dataset.data[item.dataIndex] as any;
                  const score = `${item.parsed.y}/10`;
                  return pt?.notes ? `${score} — ${pt.notes}` : score;
                },
              },
            },
          },
          scales: {
            x: {
              type: 'linear',
              min: cutoffDays,
              max: todayDays,
              border: { display: false },
              grid: { display: false },
              afterBuildTicks: (scale: any) => { scale.ticks = weekStarts.map(v => ({ value: v })); },
              ticks: {
                color: '#71717a',
                font: { size: 10 },
                callback: (val: any) => fmtDays(+val),
              },
            },
            y: {
              min: 1,
              max: 10,
              border: { display: false },
              grid: { color: '#27272C' },
              ticks: {
                color: '#71717a',
                font: { size: 10 },
                stepSize: 2,
                callback: (v: any) => [1, 3, 5, 7, 9].includes(+v) ? v : '',
              },
            },
          },
        },
      });
    }

    if ((window as any).Chart) {
      build();
    } else if (!document.querySelector('script[data-chartjs]')) {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js';
      s.setAttribute('data-chartjs', '');
      s.onload = build;
      document.head.appendChild(s);
    } else {
      document.querySelector('script[data-chartjs]')!.addEventListener('load', build, { once: true });
    }

    return () => {
      cancelled = true;
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [entries, avg, color, weeks]);

  return <canvas ref={canvasRef} />;
}

export default function MemberDashboard() {
  const { memberId } = useParams<{ memberId: string }>();
  const navigate = useNavigate();
  const [range, setRange] = useState<Range>('4w');
  const [selectedEntry, setSelectedEntry] = useState<HappinessEntry | null>(null);

  const rangeObj = RANGES.find(r => r.value === range)!;

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ['entries', memberId, rangeObj.days],
    queryFn: () => getMemberEntries(memberId!, rangeObj.days),
    enabled: !!memberId,
  });

  const { data: teams } = useQuery({ queryKey: ['teams'], queryFn: getMyTeams });
  const teamId = teams?.[0]?.id;
  const { data: summary } = useQuery({
    queryKey: ['team-summary', teamId],
    queryFn: () => getTeamSummary(teamId!),
    enabled: !!teamId,
    staleTime: 0,
  });
  const member = summary?.members.find(m => m.id === memberId);

  const avg = entries.length
    ? (entries.reduce((s, e) => s + e.score, 0) / entries.length)
    : null;

  const latestScore = entries[entries.length - 1]?.score ?? null;
  const trend = member?.trend ?? 'insufficient_data';

  const storySoFar = entries.length >= 4 && avg !== null ? (() => {
    const low = Math.min(...entries.map(e => e.score));
    const lowEntry = entries.find(e => e.score === low);
    const zone = scoreZoneLabel(avg);
    return `In the last ${rangeObj.days} days, ${member?.name ?? 'this member'} has averaged ${avg.toFixed(1)} — currently in the ${zone} zone. ${entries.length} check-ins total. Lowest score was a ${low}${lowEntry ? ` on ${formatDate(lowEntry.interaction_date)}` : ''}.`;
  })() : null;

  const chartColor = latestScore ? scoreColor(latestScore) : '#818CF8';

  if (entriesLoading) {
    return (
      <Layout>
        <div className="space-y-4 mt-4">
          <div className="h-8 w-40 bg-[#1A1A35]/50 rounded-lg animate-pulse" />
          <div className="h-48 bg-[#1A1A35]/50 rounded-2xl animate-pulse" />
          <div className="h-32 bg-[#1A1A35]/50 rounded-2xl animate-pulse" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-lg mx-auto space-y-5 pb-8">
        {/* Back + name */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="text-[rgba(180,180,255,0.35)] hover:text-white transition text-sm"
          >
            ← Back
          </button>
          <h1 className="text-xl font-black text-white">{member?.name ?? 'Member'}</h1>
        </div>

        {/* Hero score */}
        <div className="bg-[#13132A] border border-[rgba(124,111,247,0.15)] rounded-2xl p-5 flex items-center gap-5">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center"
              style={{
                boxShadow: latestScore ? `0 0 32px ${scoreColor(latestScore)}40` : undefined,
                border: `2px solid ${latestScore ? scoreColor(latestScore) : '#3f3f46'}`,
              }}
            >
              <span
                className="text-4xl font-black"
                style={{ color: latestScore ? scoreColor(latestScore) : '#71717a' }}
              >
                {latestScore ?? '—'}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black" style={{ color: trendColor(trend as 'up' | 'down' | 'stable') }}>
                {trendArrow(trend as 'up' | 'down' | 'stable')}
              </span>
              {avg !== null && (
                <span className="text-sm text-[rgba(180,180,255,0.5)]">
                  Avg <span className="text-white font-bold">{avg.toFixed(1)}</span>
                </span>
              )}
            </div>
            {latestScore && (
              <p className="text-sm text-[rgba(180,180,255,0.35)] mt-0.5">{scoreZoneLabel(latestScore)}</p>
            )}
            <p className="text-xs text-[rgba(180,180,255,0.25)] mt-1">{entries.length} check-ins</p>
          </div>
          <button
            onClick={() => navigate(`/log?memberId=${memberId}&memberName=${encodeURIComponent(member?.name ?? '')}`)}
            className="px-3 py-2 bg-white text-black text-xs font-bold rounded-xl hover:bg-zinc-200 transition"
          >
            Log score
          </button>
        </div>

        {/* Range toggle */}
        <div className="flex gap-1 bg-[#13132A] border border-[rgba(124,111,247,0.15)] rounded-xl p-1">
          {RANGES.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition ${
                range === r.value
                  ? 'bg-white text-black'
                  : 'text-[rgba(180,180,255,0.35)] hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        {entries.length > 1 ? (
          <div className="bg-[#13132A] border border-[rgba(124,111,247,0.15)] rounded-2xl p-4">
            <div style={{ height: 180 }}>
              <MemberChart entries={entries} avg={avg} color={chartColor} weeks={rangeObj.weeks} />
            </div>
          </div>
        ) : entries.length === 1 ? (
          <div className="bg-[#13132A] border border-[rgba(124,111,247,0.15)] rounded-2xl p-5 text-center text-[rgba(180,180,255,0.35)] text-sm">
            Only 1 entry — log more to see trends.
          </div>
        ) : (
          <div className="bg-[#13132A] border border-[rgba(124,111,247,0.15)] rounded-2xl p-5 text-center text-[rgba(180,180,255,0.35)] text-sm">
            No check-ins in this period.
          </div>
        )}

        {/* Story So Far */}
        {storySoFar && (
          <div
            className="rounded-2xl p-4 border-l-4 text-sm text-[rgba(180,180,255,0.5)] italic bg-[#13132A] border-[rgba(124,111,247,0.15)]"
            style={{ borderLeftColor: latestScore ? scoreColor(latestScore) : '#3f3f46' }}
          >
            {storySoFar}
          </div>
        )}

        {/* Check-in log */}
        {entries.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[rgba(180,180,255,0.5)] uppercase tracking-wider">Check-in history</p>
            <div className="bg-[#13132A] border border-[rgba(124,111,247,0.15)] rounded-2xl divide-y divide-zinc-800">
              {[...entries].reverse().map(e => (
                <div
                  key={e.id}
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[#1A1A35]/40 transition"
                  onClick={() => setSelectedEntry(e)}
                >
                  <span
                    className="text-lg font-black shrink-0 w-8 text-center"
                    style={{ color: scoreColor(e.score) }}
                  >
                    {e.score}
                  </span>
                  <div className="flex-1 min-w-0">
                    {e.notes && <p className="text-sm text-zinc-300 truncate">{e.notes}</p>}
                    <p className="text-xs text-[rgba(180,180,255,0.25)]">{formatDateLong(e.interaction_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Entry detail bottom sheet */}
      {selectedEntry && (
        <>
          <div
            className="fixed inset-0 z-50"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
            onClick={() => setSelectedEntry(null)}
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 overflow-y-auto"
            style={{
              maxHeight: '70vh',
              backgroundColor: '#13132A',
              border: '1px solid rgba(124,111,247,0.2)',
              borderBottom: 'none',
              borderRadius: '20px 20px 0 0',
            }}
          >
            <div className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      border: `2px solid ${scoreColor(selectedEntry.score)}`,
                      boxShadow: `0 0 20px ${scoreColor(selectedEntry.score)}40`,
                    }}
                  >
                    <span className="text-2xl font-black" style={{ color: scoreColor(selectedEntry.score) }}>
                      {selectedEntry.score}
                    </span>
                  </div>
                  <div>
                    <p className="text-white font-bold">{scoreZoneLabel(selectedEntry.score)}</p>
                    <p className="text-xs text-[rgba(180,180,255,0.4)] mt-0.5">
                      {formatFullDate(selectedEntry.interaction_date)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedEntry(null)}
                  className="text-[rgba(180,180,255,0.4)] hover:text-white transition text-2xl leading-none p-1 -mt-1"
                >
                  ×
                </button>
              </div>
              {selectedEntry.notes ? (
                <p className="text-sm text-zinc-300 leading-relaxed">{selectedEntry.notes}</p>
              ) : (
                <p className="text-sm italic" style={{ color: 'rgba(180,180,255,0.25)' }}>No notes recorded.</p>
              )}
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}
