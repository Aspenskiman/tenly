# Philosophy Changes Design
**Date:** 2026-05-02

## Overview

Four connected UI-only changes that align the app's copy and log screen with Tenly's core philosophy: leaders who know their people, not managers tracking metrics.

No server changes. No DB schema changes. Frontend only.

---

## Change 1 — "Manager" → "Leader" (UI copy)

Replace every visible string containing "manager" / "Manager" with "leader" / "Leader". Variable names, role checks, DB fields, and backend code are untouched.

### Affected files and strings

| File | Old text | New text |
|---|---|---|
| `client/src/components/Navbar.tsx` | "Team Manager" | "Team Leader" |
| `client/src/pages/CreatorDashboard.tsx` | "No manager assigned" | "No leader assigned" |
| `client/src/pages/CreatorDashboard.tsx` | "Select manager…" | "Select leader…" |
| `client/src/pages/CreatorDashboard.tsx` | "No available managers" | "No available leaders" |
| `client/src/pages/CreatorDashboard.tsx` | "Invite Manager" (button label) | "Invite Leader" |
| `client/src/pages/CreatorDashboard.tsx` | placeholder `manager@company.com` | `leader@company.com` |
| `client/src/pages/CreatorDashboard.tsx` | `<StatCard label="Managers" …>` | `label="Leaders"` |
| `client/src/components/UpgradeModal.tsx` | "2–15 managers" | "2–15 leaders" |
| `client/src/pages/SetupCompany.tsx` | "Unlimited managers" (×2) | "Unlimited leaders" |
| `client/src/components/PlanModal.tsx` | "Unlimited managers" (×2) | "Unlimited leaders" |

---

## Change 2 — Score question reframe (`LogScore.tsx`)

Replace the label above the 1–10 score grid.

- **Current:** "What's their Tenly score?"
- **New (member selected):** "How is [firstName]'s whole life this week?"
- **New (no member / fallback):** "How is your team member's whole life this week?"

`firstName` is derived from `selectedMember?.name.split(' ')[0] ?? 'your team member'`. The score grid is already inside `{selectedMemberId && (…)}` so the member is always available when the label is visible; the fallback handles the edge case where member data hasn't loaded yet.

---

## Change 3 — Notes field reframe + soft post-save prompt (`LogScore.tsx`)

### Field copy
- **Label:** "What do you want to remember from this conversation?"
- **Placeholder:** "Even one sentence helps you remember what mattered."

### Soft prompt after saving with no notes
- Add `showNotePrompt: boolean` state (default `false`).
- In `onSuccess`: capture `const hadNoNotes = !notes.trim()` before clearing state. If true, set `showNotePrompt(true)`.
- Render below the save button when `showNotePrompt` is true: `"A quick note now saves the conversation later."` — small, muted (`theme.textMute`), no border, no icon.
- Auto-navigate timing: 2500 ms when `hadNoNotes`, 1200 ms otherwise.
- `showNotePrompt` is cleared on navigate (unmount).

---

## Change 4 — Permanent teaching moment (`LogScore.tsx`)

After a score is selected, two new lines appear below the existing conversation suggestion card. They never disappear while a score is selected.

### Zone label
`scoreZoneLabel(score)` from `lib/scores.ts` (existing function). Displayed in `theme.textMute`, small, centered.

### Teaching line
Keyed to score range, always visible once score is selected:

| Score | Teaching line |
|---|---|
| 1–3 | "They showed you something real. Respond with presence, not a plan." |
| 4–6 | "Ask what would have made it one higher. Then just listen." |
| 7–8 | "Doing well doesn't mean nothing to explore. Ask what's working." |
| 9–10 | "High scores deserve curiosity too. Ask what made this week different." |

**Style:** `text-xs`, `theme.textMute` color, centered, not bold. Not a card. Not a banner. Inline text only.

Implemented as a `const TEACHING_LINES: Record<string, string>` with a `getTeachingLine(score: number)` helper (score ranges to string key).

---

## Implementation scope

- `client/src/pages/LogScore.tsx` — Changes 2, 3, 4
- `client/src/components/Navbar.tsx` — Change 1
- `client/src/pages/CreatorDashboard.tsx` — Change 1
- `client/src/components/UpgradeModal.tsx` — Change 1
- `client/src/pages/SetupCompany.tsx` — Change 1
- `client/src/components/PlanModal.tsx` — Change 1

No new files. No server changes. No routing changes.
