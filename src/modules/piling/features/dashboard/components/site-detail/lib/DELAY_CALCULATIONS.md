# Delay report business rules: Start Delay, Activity Delay, Idle Time

This is the spec for the delay figures computed here in `timelineMath.ts`
(`computeStartDelay`, `expectedStepStart`, `computeActivityDelay`,
`computeDelayTotals`) and rendered live on the Site Detail page (pile timeline
cards, delay summary card, pile detail drawer). It mirrors the Excel report built
server-side by `report_service.get_delay_report` /
`delay_service.py` in suntech-core
(`suntech-core/modules/piling/daily_checklists/DELAY_CALCULATIONS.md`, same file
name, next to that code) — **the two are kept in sync by hand**. If you change the
rules here, change them there too, and vice versa.

## Start Delay

**What it answers:** how late (positive) or how early (negative) a step's actual
start was, compared to when it could *realistically* have started — not compared
to its originally planned start. A step that was always going to be late because
the machine was still finishing the previous job isn't "the crew's fault"; Start
Delay only counts lateness beyond what upstream delays already explain.

### The chain

Every plan step has a **buffer** — setup/travel time that must elapse, on that
specific machine, before real work on the step can begin (`stepWorkStart()` in the
mobile app's `utils/helpers.ts` locates this same "buffer, then work" boundary for
a single step). A step's realistic ("expected") start is:

```
expectedStart(step N) = anchor + step N's own bufferMinutes
```

where `anchor` is:

- **step N‑1's `actualEnd`**, if that previous step has actually finished, or
- **step N‑1's resolved planned end** (`resolvePlannedEnd()` in `siteDetail.api.ts`:
  `plannedStart + durationMinutes + bufferMinutes`), if it hasn't finished yet —
  used whenever `plannedEnd` is null, which happens whenever a step's natural end
  would run past the plan window and so no committed end time was persisted; null
  means "continuing," not "no data."

`startDelay = actualStart − expectedStart`. `null` (not shown as `0`) when the step
has no `actualStart` yet, or when no anchor can be resolved at all.

### Chain scope: per machine, not per pile

**Step N‑1 above means "the previous step on the same physical machine," across
every pile that machine works on that day — not "the previous step in this pile."**
A rig doesn't forget how late it's running just because it moved on to a new pile.
`computeDelayTotals()` groups rows by machine (`row.plannedMachine?.id`, falling
back to `row.pileRig.id`/`row.pileCrane.id` by track for the rare unassigned case —
mirrors the same fallback `report_service.py` uses), sorted by `plannedStart`
(chronological — the scheduler already lays out one machine's day in order
regardless of which pile each step belongs to), and chains through that list. A
pile's first step chains off the *same machine's* previous pile's last step.

**Base case:** only the very first step a machine performs in the whole checklist
— nothing before it in that machine's chain — has no `step N‑1` to anchor on. That
one anchors on **the step's own `plannedStart`** instead (falling back to
`planStartTime` only if `plannedStart` is somehow unset).

Use `plannedStart`, not `planStartTime`, for this base case. `plannedStart` already
reflects any non-working-window skip (e.g. a shift-change break) the scheduler
applied when laying out the plan — `planStartTime` is just the raw declared shift
start and does not. Example: shift declared to start 8:10 AM, but a shift-change
break runs 8:00–9:00 AM, so the machine's first real step is planned to start at
9:00 AM. Anchoring on `planStartTime` (8:10 AM) instead of that step's own
`plannedStart` (9:00 AM) produces an "expected start" *earlier* than the plan
itself says the step could ever realistically begin, inflating the reported delay.

Do **not** reset the anchor to `planStartTime` for every pile's first step either —
that was an earlier bug this doc was written to prevent from recurring. It made
every pile's first-step "Expected Start" identical regardless of how far behind the
machine already was.

### Worked examples

**Within a chain (already correct, unaffected by the per-machine fix):**
Step 1 planned 10:00 AM–12:00 PM. Actually starts 11:00 AM, finishes 1:00 PM — its
Activity Delay is `0` (worked its full planned 120 minutes, just shifted later).
Step 2 has a 10-minute buffer. Because step 1 didn't finish until 1:00 PM (actual),
`anchor = 1:00 PM`, so `expectedStart(step 2) = 1:00 PM + 10 min = 1:10 PM` — *not*
step 2's originally planned start time. If step 2 actually starts at 1:15 PM,
`startDelay(step 2) = 1:15 PM − 1:10 PM = +5 minutes`.

**Across a pile boundary (the case this fix addresses):** machine RIG‑01 works
pile A (CASING → BORING), then pile B (CASING → BORING). Suppose RIG‑01 finishes
pile A's BORING late — `actualEnd` at 3:40 PM against a plan that assumed 2:50 PM.
Pile B's CASING has a 15‑minute buffer. `expectedStart(pile B CASING) = 3:40 PM +
15 min = 3:55 PM` — chained off RIG‑01's real finish time on pile A, regardless of
what pile B's CASING was originally planned to start. If it actually starts at
4:00 PM, `startDelay = +5 minutes`, isolating only the *new* delay introduced at
this step.

### `null` cases

- No `actualStart` recorded yet → `null` (not `0` — "no data" is not "on time").
- No resolvable anchor → `null`.

## Activity Delay

**What it answers:** did the step itself take longer or shorter than planned,
once time that wasn't really "working" is excluded.

```
grossMinutes  = (actualEnd, or now if still running) − actualStart
nettedMinutes = machine downtime on this step's track, overlapping [actualStart, actualEnd]
              + non-working windows (lunch/shift-change), overlapping [actualStart, actualEnd]
netMinutes    = max(0, grossMinutes − nettedMinutes)
activityDelay = netMinutes − durationMinutes
```

Machine downtime windows are **track-scoped** (only this step's own track's
breakdowns count against it, via `downtimeWindows.filter(w => w.track === row.track)`).
Non-working windows are **not** track-scoped — they stop everyone, so they're
netted out unconditionally. `netMinutes` is floored at `0`. Positive = ran long
even after netting; negative = finished faster. `null` when there's no
`actualStart` yet, or the step has no `durationMinutes` to compare against.

This calculation is per-step and self-contained — it does not chain across steps
or piles the way Start Delay does, so `computeDelayTotals()` sums it over every
row independently (no grouping needed).

## Idle Time

Idle Time (per-machine idle spans netted against non-working windows and each
step's own buffer, feeding the "Idle Time" Excel sheet and its `idle_pct`) is
computed **server-side only** — `delay_service.compute_machine_idle_windows()`
in suntech-core. A machine is idle whenever it isn't running one of its own
logged actual steps, isn't inside a non-working window, and isn't inside a
step's own buffer window (the same `expected_step_start` anchor+buffer math
Start Delay uses, reused rather than recomputed) — this includes gaps between
steps, before the first step, and after the last one, whether or not a
`BREAKDOWN` event was logged for that time (a logged breakdown just supplies
the *reason* via a `source: "explicit" | "inferred"` marker per row, it
doesn't change whether the time counts as idle). Because of the shared buffer
math, a chain-internal idle gap's duration now equals that step's
`start_delay_min` whenever it's positive. There is no client-side equivalent
in this file — the web dashboard doesn't currently render a live idle-time
view. See the suntech-core companion doc for the full rule if this ever needs
a client-side counterpart.

## Per-card badges in the single-pile drawer

`computeDelayTotals()` (used for the delay summary card and the pile-detail
drawer's header totals) uses the per-machine chain described above.
`PlanActualStepColumn.tsx`'s per-step "start +N min" badge can use the same
chain, via an optional `previousRowByStepKey` map (built by
`buildMachineChainPreviousRowMap()`) threaded down through `PileDetailSheet`
→ `PileTimelinePanel` → `PlanActualStepColumn`. When that map is supplied,
each row looks up its true machine-chain predecessor (`rowChainKey(row)` —
`stepId` alone isn't unique across piles within one day's checklist, see
`dedupeByStepId` in `siteDetail.api.ts`) instead of falling back to
`cells[index - 1]`, which is scoped to one pile's own rows and can't see
what a machine was doing on a *different* pile just before.

**Wired up in the Overview (single-day) drawer** — `PilesOverviewTable.tsx`
fetches that date's whole checklist (`usePlanState` → `checklistId` →
`useChecklistDetail`) purely to build this map, since it already has
everything needed (every pile's rows for that one date) without any backend
change.

**Not wired up in the Range (date-range) drawer** — `RangePileTable.tsx`
still calls `PlanActualStepColumn` without `previousRowByStepKey`, so it
falls back to the pile-local `cells[index - 1]` approximation described
above. A date range can span many separate daily checklists, so a correct
fix there means fetching each date's checklist in range, not just one —
not yet done. A pile's first-step badge in that view can still show a
different number than the correct cascaded figure shown in the totals
directly above it in the same drawer.
