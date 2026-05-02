# Philosophy Changes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply four connected UI-only changes that align Tenly's copy and log screen with its core philosophy.

**Architecture:** Pure frontend changes across six files. No server, no DB, no routing changes. LogScore.tsx receives the most work (Changes 2–4); the other five files each get targeted string replacements (Change 1).

**Tech Stack:** React 18, TypeScript, Tailwind CSS, `theme` design tokens from `client/src/lib/theme.ts`, score helpers from `client/src/lib/scores.ts`

---

## Task 1 — "Manager" → "Leader" (UI copy, five files)

**Files:**
- Modify: `client/src/components/Navbar.tsx`
- Modify: `client/src/pages/CreatorDashboard.tsx`
- Modify: `client/src/components/UpgradeModal.tsx`
- Modify: `client/src/pages/SetupCompany.tsx`
- Modify: `client/src/components/PlanModal.tsx`

- [ ] **Step 1: Update Navbar.tsx**

In `client/src/components/Navbar.tsx`, find line 124 and change:

```tsx
// Before
<Link to="/dashboard" style={tabStyle(!onCreator)}>Team Manager</Link>

// After
<Link to="/dashboard" style={tabStyle(!onCreator)}>Team Leader</Link>
```

- [ ] **Step 2: Update CreatorDashboard.tsx — "No manager assigned"**

Find:
```tsx
{manager ? manager.name : 'No manager assigned'}
```
Replace with:
```tsx
{manager ? manager.name : 'No leader assigned'}
```

- [ ] **Step 3: Update CreatorDashboard.tsx — dropdown options**

Find:
```tsx
<option value="" disabled>Select manager…</option>
```
Replace with:
```tsx
<option value="" disabled>Select leader…</option>
```

Find:
```tsx
<option disabled>No available managers</option>
```
Replace with:
```tsx
<option disabled>No available leaders</option>
```

- [ ] **Step 4: Update CreatorDashboard.tsx — invite button and placeholder**

Find:
```tsx
          Invite Manager
```
Replace with:
```tsx
          Invite Leader
```

Find:
```tsx
            placeholder="manager@company.com"
```
Replace with:
```tsx
            placeholder="leader@company.com"
```

- [ ] **Step 5: Update CreatorDashboard.tsx — stat card**

Find:
```tsx
          <StatCard label="Managers" value={stats?.managerCount} />
```
Replace with:
```tsx
          <StatCard label="Leaders" value={stats?.managerCount} />
```

- [ ] **Step 6: Update UpgradeModal.tsx**

In `client/src/components/UpgradeModal.tsx`, find:
```tsx
                <p className="text-xs text-[rgba(180,180,255,0.4)]">2–15 managers · Executive dashboard</p>
```
Replace with:
```tsx
                <p className="text-xs text-[rgba(180,180,255,0.4)]">2–15 leaders · Executive dashboard</p>
```

- [ ] **Step 7: Update SetupCompany.tsx**

In `client/src/pages/SetupCompany.tsx`, find both occurrences of `'Unlimited managers'` (lines 20 and 28) and replace both with `'Unlimited leaders'`.

The features arrays should read:
```ts
    features: ['Unlimited teams', 'Unlimited leaders', 'Weekly digest email', 'Score history & trends'],
```
and:
```ts
    features: ['Unlimited teams', 'Unlimited leaders', 'Executive dashboard', 'Company-wide analytics'],
```

- [ ] **Step 8: Update PlanModal.tsx**

In `client/src/components/PlanModal.tsx`, find both occurrences of `'Unlimited managers'` (lines 22 and 29) and replace both with `'Unlimited leaders'`.

The features arrays should read:
```ts
    features: ['Unlimited teams', 'Unlimited leaders', 'Weekly digest email', 'Score history & trends'],
```
and:
```ts
    features: ['Unlimited teams', 'Unlimited leaders', 'Executive dashboard', 'Company-wide analytics'],
```

- [ ] **Step 9: Verify**

Start the dev server (`npm run dev` inside `client/`). Check:
- Navbar creator toggle shows "Team Leader" (visible when logged in as a creator role)
- Creator dashboard shows "No leader assigned", "Select leader…", "No available leaders", "Invite Leader", placeholder `leader@company.com`, stat card "Leaders"
- UpgradeModal shows "2–15 leaders"
- SetupCompany and PlanModal feature lists show "Unlimited leaders"

- [ ] **Step 10: Commit**

```bash
git add client/src/components/Navbar.tsx client/src/pages/CreatorDashboard.tsx client/src/components/UpgradeModal.tsx client/src/pages/SetupCompany.tsx client/src/components/PlanModal.tsx
git commit -m "feat: rename manager to leader across all UI copy"
```

---

## Task 2 — Score question reframe (Change 2)

**Files:**
- Modify: `client/src/pages/LogScore.tsx`

- [ ] **Step 1: Replace the score label**

In `client/src/pages/LogScore.tsx`, find:
```tsx
            <label className="text-xs font-semibold text-[rgba(180,180,255,0.5)] uppercase tracking-wider">
              What's their Tenly score?
            </label>
```
Replace with:
```tsx
            <label className="text-xs font-semibold text-[rgba(180,180,255,0.5)] uppercase tracking-wider">
              {`How is ${selectedMember?.name.split(' ')[0] ?? 'your team member'}'s whole life this week?`}
            </label>
```

`selectedMember` is already defined above as `members.find(m => m.id === selectedMemberId)`. The `?.` handles the brief window when member data is still loading.

- [ ] **Step 2: Verify**

In the browser on the Log screen:
- Before selecting a member: the label is not shown (the score grid is inside `{selectedMemberId && (…)}`).
- After selecting "Alice Park": label reads "How is Alice's whole life this week?"
- After selecting "Bob Nguyen": label reads "How is Bob's whole life this week?"

- [ ] **Step 3: Commit**

```bash
git add client/src/pages/LogScore.tsx
git commit -m "feat: reframe score question to whole-life framing"
```

---

## Task 3 — Notes field reframe + soft post-save prompt (Change 3)

**Files:**
- Modify: `client/src/pages/LogScore.tsx`

- [ ] **Step 1: Add showNotePrompt state**

Near the top of the `LogScore` component, alongside the other `useState` declarations (around line 38), add:

```tsx
  const [showNotePrompt, setShowNotePrompt] = useState(false);
```

- [ ] **Step 2: Update onSuccess to capture hadNoNotes**

Find the `onSuccess` callback inside `useMutation` (currently starts at line ~67). Replace it entirely:

```tsx
    onSuccess: () => {
      const hadNoNotes = !notes.trim();
      qc.invalidateQueries({ queryKey: ['team-summary'] });
      qc.invalidateQueries({ queryKey: ['entries', selectedMemberId] });
      setSaved(true);
      setScore(null);
      setNotes('');
      if (hadNoNotes) setShowNotePrompt(true);
      setTimeout(() => {
        setSaved(false);
        setShowNotePrompt(false);
        navigate('/roster');
      }, hadNoNotes ? 2500 : 1200);
    },
```

- [ ] **Step 3: Update notes label and placeholder**

Find:
```tsx
            <label className="text-xs font-semibold text-[rgba(180,180,255,0.5)] uppercase tracking-wider">Note (optional)</label>
```
Replace with:
```tsx
            <label className="text-xs font-semibold text-[rgba(180,180,255,0.5)] uppercase tracking-wider">What do you want to remember from this conversation?</label>
```

Find:
```tsx
              placeholder="What came up in the conversation?"
```
Replace with:
```tsx
              placeholder="Even one sentence helps you remember what mattered."
```

- [ ] **Step 4: Add soft prompt below the save button**

Find the Cancel button that follows the save button:
```tsx
        {/* Cancel */}
        <button
          onClick={() => navigate('/roster')}
```
Insert the prompt **between** the save button and the cancel button:
```tsx
        {/* Soft no-notes prompt */}
        {showNotePrompt && (
          <p className="text-xs text-center" style={{ color: 'rgba(180,180,255,0.3)' }}>
            A quick note now saves the conversation later.
          </p>
        )}

        {/* Cancel */}
        <button
          onClick={() => navigate('/roster')}
```

- [ ] **Step 5: Verify**

Test both flows:
1. Select a member, choose a score, add a note, save → "✓ Logged" appears, no prompt, navigates to roster after ~1.2s.
2. Select a member, choose a score, leave notes empty, save → "✓ Logged" appears, soft prompt "A quick note now saves the conversation later." appears below the button, navigates to roster after ~2.5s.

Check that the notes label and placeholder text are correct.

- [ ] **Step 6: Commit**

```bash
git add client/src/pages/LogScore.tsx
git commit -m "feat: reframe notes field and add soft post-save prompt"
```

---

## Task 4 — Zone label + teaching moment (Change 4)

**Files:**
- Modify: `client/src/pages/LogScore.tsx`

- [ ] **Step 1: Add scoreZoneLabel to the scores import**

Find the import at the top of `LogScore.tsx`:
```tsx
import { scoreColor, formatDate } from '../lib/scores';
```
Replace with:
```tsx
import { scoreColor, formatDate, scoreZoneLabel } from '../lib/scores';
```

- [ ] **Step 2: Add getTeachingLine helper**

Directly below the `SUGGESTIONS` constant (around line 26, before `export default function LogScore()`), add:

```tsx
function getTeachingLine(score: number): string {
  if (score >= 9) return "High scores deserve curiosity too. Ask what made this week different.";
  if (score >= 7) return "Doing well doesn't mean nothing to explore. Ask what's working.";
  if (score >= 4) return "Ask what would have made it one higher. Then just listen.";
  return "They showed you something real. Respond with presence, not a plan.";
}
```

- [ ] **Step 3: Insert zone label and teaching line after the suggestion card**

The suggestion card closes with `)}`. Directly after that closing `)}` — still inside the outer `<div className="space-y-2">` — insert the following block:

```tsx
            {/* Zone label + teaching moment */}
            {score && (
              <div className="text-center space-y-1 pt-1">
                <p className="text-xs" style={{ color: 'rgba(180,180,255,0.3)' }}>
                  {scoreZoneLabel(score)}
                </p>
                <p className="text-xs" style={{ color: 'rgba(180,180,255,0.3)' }}>
                  {getTeachingLine(score)}
                </p>
              </div>
            )}
```

The structure after insertion should look like:

```tsx
            {/* Conversation suggestion card */}
            {score && (
              <div key={score} ...>
                <p className="text-sm italic text-zinc-300">{SUGGESTIONS[score]}</p>
              </div>
            )}

            {/* Zone label + teaching moment */}
            {score && (
              <div className="text-center space-y-1 pt-1">
                <p className="text-xs" style={{ color: 'rgba(180,180,255,0.3)' }}>
                  {scoreZoneLabel(score)}
                </p>
                <p className="text-xs" style={{ color: 'rgba(180,180,255,0.3)' }}>
                  {getTeachingLine(score)}
                </p>
              </div>
            )}
          </div>
        )}
```

- [ ] **Step 4: Verify**

On the Log screen, select a member and tap each score:
- Score 1: zone label "Needs Support", teaching line "They showed you something real. Respond with presence, not a plan."
- Score 5: zone label "Holding", teaching line "Ask what would have made it one higher. Then just listen."
- Score 7: zone label "Sweet Spot", teaching line "Doing well doesn't mean nothing to explore. Ask what's working."
- Score 10: zone label "Thriving", teaching line "High scores deserve curiosity too. Ask what made this week different."
- Both lines are small, muted, centered — not bold, not bordered.
- Lines appear immediately on score selection and stay visible (don't fade).

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/LogScore.tsx
git commit -m "feat: add zone label and teaching moment to log screen"
```

---

## Task 5 — Deploy to Vercel and Render

- [ ] **Step 1: Push to master**

```bash
git push origin master
```

- [ ] **Step 2: Verify Vercel deployment**

Vercel auto-deploys on push to master. Watch the Vercel dashboard for the build to complete (~1–2 min). Once live, open the production URL and verify:
- Log screen shows new question, notes label, teaching lines
- Navbar shows "Team Leader" for creator accounts

- [ ] **Step 3: Verify Render deployment**

Render auto-deploys on push. No server code changed so the deploy is just a restart — the new `render.yaml` `startCommand` (changed in a prior session to remove `--force-reset`) will take effect here. Confirm the server comes back healthy at `/health`.

- [ ] **Step 4: Smoke test production**

1. Log in, navigate to Log a Score
2. Select a team member → confirm "How is [Name]'s whole life this week?"
3. Select score 8 → confirm "Sweet Spot" zone label and "Doing well doesn't mean nothing to explore. Ask what's working."
4. Save with no notes → confirm soft prompt appears, auto-navigates after ~2.5s
5. If creator account: confirm Navbar shows "Team Leader"
