# Chart Weekly Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Team Dashboard chart's 4 day-based range tabs with 4 week-based tabs (1 Month / 3 Months / 6 Months / 1 Year), each aggregating entries by ISO week and showing one data point per week.

**Architecture:** All changes are in a single file — `client/src/pages/TeamDashboard.tsx`. The `RANGES` constant and `Range` type are replaced. A `getISOWeekStart` helper is added. `TeamTrendChart` gains a `weeks` prop and its internal build logic is replaced with ISO-week bucketing that trims to the last `weeks` weeks. The parent passes `rangeObj.weeks` and uses `rangeObj.days` (a slightly larger buffer) for the API fetch.

**Tech Stack:** React 18, TypeScript, Chart.js 4 (loaded via CDN), `MemberWithTrend` from `client/src/api/teams.ts`

---

## Task 1 — Replace RANGES, type, default, and call site

**Files:**
- Modify: `client/src/pages/TeamDashboard.tsx`

- [ ] **Step 1: Replace the Range type and RANGES constant**

Find (lines 17–23):
```tsx
type Range = '7d' | '30d' | '90d' | '12mo';
const RANGES: { label: string; value: Range; days: number }[] = [
  { label: '7d',   value: '7d',   days: 7   },
  { label: '30d',  value: '30d',  days: 30  },
  { label: '90d',  value: '90d',  days: 90  },
  { label: '12mo', value: '12mo', days: 365 },
];
```

Replace with:
```tsx
type Range = '1mo' | '3mo' | '6mo' | '1yr';
const RANGES: { label: string; value: Range; weeks: number; days: number }[] = [
  { label: '1 Month',  value: '1mo', weeks: 4,  days: 35  },
  { label: '3 Months', value: '3mo', weeks: 12, days: 91  },
  { label: '6 Months', value: '6mo', weeks: 26, days: 189 },
  { label: '1 Year',   value: '1yr', weeks: 52, days: 371 },
];
```

`days` is one extra week larger than `weeks × 7` to ensure the API always returns at least N complete ISO weeks regardless of where today falls in the week.

- [ ] **Step 2: Update default selected range**

Find:
```tsx
  const [range, setRange] = useState<Range>('30d');
```

Replace with:
```tsx
  const [range, setRange] = useState<Range>('1mo');
```

- [ ] **Step 3: Update TeamTrendChart call site to pass weeks**

Find:
```tsx
            <TeamTrendChart members={members} teamAvg={teamAvg} />
```

Replace with:
```tsx
            <TeamTrendChart members={members} teamAvg={teamAvg} weeks={rangeObj.weeks} />
```

- [ ] **Step 4: Verify the queryKey still uses rangeObj.days**

The existing query should already use `rangeObj.days`. Confirm lines ~272–277 look like:
```tsx
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['team-summary', teamId, rangeObj.days],
    queryFn: () => getTeamSummary(teamId!, rangeObj.days),
    enabled: !!teamId,
  });
```

No change needed here — `rangeObj.days` now resolves to 35 / 91 / 189 / 371, which is correct.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/TeamDashboard.tsx
git commit -m "feat: replace day-based chart tabs with weekly range tabs"
```

---

## Task 2 — Refactor TeamTrendChart to aggregate by ISO week

**Files:**
- Modify: `client/src/pages/TeamDashboard.tsx`

- [ ] **Step 1: Add getISOWeekStart helper**

Directly above the `TeamTrendChart` function definition (before line 25 `function TeamTrendChart`), add:

```tsx
function getISOWeekStart(dateStr: string): string {
  const [y, mo, da] = dateStr.split('-').map(Number);
  const d = new Date(y, mo - 1, da);
  const day = d.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift to Monday
  d.setDate(d.getDate() + diff);
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}
```

- [ ] **Step 2: Add weeks to TeamTrendChart props**

Find:
```tsx
function TeamTrendChart({ members, teamAvg }: { members: MemberWithTrend[]; teamAvg: number | null }) {
```

Replace with:
```tsx
function TeamTrendChart({ members, teamAvg, weeks }: { members: MemberWithTrend[]; teamAvg: number | null; weeks: number }) {
```

- [ ] **Step 3: Replace the build() internals with weekly aggregation**

Inside `TeamTrendChart`, the `build()` function currently starts with:
```tsx
      const allDates = [
        ...new Set(members.flatMap(m => m.entries.map(e => e.interaction_date.slice(0, 10)))),
      ].sort();
      if (!allDates.length) return;

      const labels = allDates.map(d => {
        const [y, mo, da] = d.split('-').map(Number);
        return new Date(y, mo - 1, da).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });

      const avgData = allDates.map(date => {
        const scores = members.flatMap(m =>
          m.entries.filter(e => e.interaction_date.slice(0, 10) === date).map(e => e.score)
        );
        return scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : null;
      });
```

And then continues with `avgDataset` and `memberDatasets` that use `allDates`.

Replace the entire block from `const allDates` through the end of `memberDatasets` with:

```tsx
      // Collect all ISO week starts, sort, take last N weeks
      const weekSet = new Set<string>();
      members.forEach(m =>
        m.entries.forEach(e =>
          weekSet.add(getISOWeekStart(e.interaction_date.slice(0, 10)))
        )
      );
      const allWeeks = [...weekSet].sort().slice(-weeks);
      if (!allWeeks.length) return;

      const labels = allWeeks.map(w => {
        const [y, mo, da] = w.split('-').map(Number);
        return new Date(y, mo - 1, da).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      });

      const avgData = allWeeks.map(weekStart => {
        const scores = members.flatMap(m =>
          m.entries
            .filter(e => getISOWeekStart(e.interaction_date.slice(0, 10)) === weekStart)
            .map(e => e.score)
        );
        return scores.length ? +(scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2) : null;
      });

      const avgDataset = {
        label: `Team avg ${teamAvg !== null ? teamAvg.toFixed(1) : '—'}`,
        data: avgData,
        borderColor: '#FFFFFF',
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderWidth: 3,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 4,
        spanGaps: true,
        fill: true,
        order: 0,
      };

      const memberDatasets = members.map((m, i) => ({
        label: m.name.split(' ')[0],
        data: allWeeks.map(weekStart => {
          const weekEntries = m.entries.filter(e =>
            getISOWeekStart(e.interaction_date.slice(0, 10)) === weekStart
          );
          return weekEntries.length
            ? +(weekEntries.reduce((s, e) => s + e.score, 0) / weekEntries.length).toFixed(2)
            : null;
        }),
        borderColor: CHART_COLORS[i % CHART_COLORS.length],
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        tension: 0,
        pointRadius: 0,
        pointHoverRadius: 4,
        spanGaps: true,
        fill: false,
        order: i + 1,
      }));
```

- [ ] **Step 4: Add weeks to the useEffect dependency array**

Find:
```tsx
  }, [members, teamAvg]);
```

Replace with:
```tsx
  }, [members, teamAvg, weeks]);
```

- [ ] **Step 5: Verify the file reads cleanly**

Read `client/src/pages/TeamDashboard.tsx` and confirm:
- `getISOWeekStart` is defined above `TeamTrendChart`
- `TeamTrendChart` accepts `weeks` in its props destructure
- `build()` uses `allWeeks` (not `allDates`)
- The `useEffect` dep array includes `weeks`
- `avgDataset` and `memberDatasets` are still present and complete
- No TypeScript errors visible (no references to `allDates`, all variables used)

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/TeamDashboard.tsx
git commit -m "feat: aggregate chart by ISO week with weekly x-axis labels"
```

---

## Task 3 — Deploy

- [ ] **Step 1: Push to master**

```bash
git push origin master
```

- [ ] **Step 2: Verify Vercel deployment**

Wait ~2 min for Vercel to rebuild. Open the production URL, navigate to the Team Dashboard, and verify:
- Four tabs show: "1 Month", "3 Months", "6 Months", "1 Year"
- "1 Month" is selected by default
- The chart x-axis shows week-start dates like "Apr 28", "May 5" (not individual days)
- Switching tabs re-fetches data and the chart updates
- The number of data points is ~4 / ~12 / ~26 / ~52 for each tab

- [ ] **Step 3: Confirm Render health**

```
GET https://tenly.onrender.com/health
```

Expected: `{"status":"ok","timestamp":"..."}` — server unaffected (no server changes).
