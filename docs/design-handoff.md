# Design Handoff — Our Little Universe (Night Ticket)

**Audience:** implementers maintaining the gift UI  
**Source:** Night Ticket reimagine (shipped 2026-07-15) + celebration keepsake fold (Variant A, 2026-07-15) + prior polish IA  
**Product intent:** a one-person romantic gift, not a generic date app. Preserve husband voice. Visual system is **Night Ticket** (dusk atmosphere, cream ticket surfaces, amber accents). Couple cartoon remains as art on landing/locked; Quiet Letter is a reserved alternate only (`?variant=B` in dev). Prefer *less competing stuff at emotional peaks*.

---

## 0. Visual system decision

| Surface | Treatment |
|---|---|
| First-visit landing | Perforated night ticket (`NightTicketLanding`) — brand is hero |
| Quest / celebration / locked / whisper | Same dusk page; quest/locked/whisper use cream ticket panels; celebration uses keepsake reveal (verse + cream plan card) |
| Quiet Letter | Reserved alternate — do not ship as default |

IA from the polish pass still applies: wizard steps, celebration peak order, More options ladder, whisper a11y.

---

## 1. Design tokens (source of truth)

Use token names from `src/index.css` `@theme`. Do not hardcode hex in components unless matching an existing utility.

### Color

| Token | Value | Use |
|---|---|---|
| `night-dusk` | `#1e3a3a` | Page mid, badge/atmosphere |
| `night-mid` | `#2a5550` | Gradient top, constellation dust |
| `night-deep` | `#0f1f1f` | Primary CTA fill, ink on cream, page bottom |
| `night-cream` | `#f7f0e4` | Ticket panels, body text on dusk, secondary CTA fill |
| `night-amber` | `#f0a35e` | Accent, selection, eyebrows, quotes, progress active |

Legacy aliases (`romantic-pink`, `sunny-yellow`, etc.) remap to amber/cream for compatibility — prefer `night-*` in new code.

**Contrast floor:** On dusk, readable chrome ≥ `night-cream/65`. On cream panels, body ≥ `night-deep/70`. Footer “MADE FOR YOU” → `app-footer-mark` (cream/55).

### Typography

| Role | Family | Weight | Notes |
|---|---|---|---|
| Display / eyebrows / CTAs / ticket brand | `Barlow Condensed` (`--font-display`) | 600–700 | Uppercase + wide tracking on chrome |
| Body / prompts on cream | `Figtree` (`--font-body`) | 400–600 | Normal case inside ticket panels |
| Quiet Letter only | Fraunces + Caveat | — | Prototype `?variant=B` |

**Type scale:**

| Element | Mobile | ≥640px (`sm`) |
|---|---|---|
| Landing brand (ticket) | `clamp(2rem, 8vw, 2.75rem)` | same |
| Celebration H1 | `2.25rem` | `2.75rem` |
| Celebration locked date | `2.5rem` / weight 700 | `2.75rem` |
| Question prompt (H2) | `1.5rem` | `1.875rem` |
| Love letter body | `1rem` / lh 1.65 | `1.0625rem` |
| Eyebrow | `0.75rem` | same |

### Radius & shadow

| Token | Value | Use |
|---|---|---|
| `radius-ticket` | `4px` | `.sticker-card`, `.date-ticket`, night ticket |
| `radius-pill` | `9999px` | `.pill-button`, cuisine pills, badge |
| `shadow-sticker` | deep dusk drop + amber hairline | ticket panels |

### Motion

| Token / pattern | Spec |
|---|---|
| Card enter (QuestionCard) | spring `stiffness: 180`, `damping: 22`, `mass: 0.8`; y 24→0 |
| Ticket hover | `transform 0.2s`; translateY(-2px) — no inflated scale |
| Confetti | amber, cream, mid teal, dusk (`#f0a35e`, `#f7f0e4`, `#2a5550`, `#1e3a3a`) |
| `prefers-reduced-motion` | global kill-switch in `index.css` — keep |

---

## 2. Global chrome

### Universe badge (fixed top)

- **Copy:** `OUR LITTLE UNIVERSE`
- **Style:** `.universe-badge` — frosted deep, amber hairline, cream type
- **First-visit landing:** hidden (brand lives on the ticket)
- **Long-press (husband Love Brief):** unchanged — 750ms on badge when plan locked

### Footer

- Fixed: `MADE FOR YOU` via `.app-footer-mark`
- Hidden on first-visit night-ticket landing (ticket has its own footer line)

---

## 3. Screen: Landing (first visit)

### Layout (one composition)

1. Full-bleed dusk + soft couple vignette backdrop
2. Perforated cream ticket: stub → brand **Our Little Universe** → Hey Jennifer → support → meta → tear-off CTA
3. Tiny footer: `YOUR WISHES · MY PLAN`

**Brand decision:** Brand name wins as hero on the ticket. Greeting is secondary inside the ticket.

| Element | Copy |
|---|---|
| Stub | `Admit one` |
| Brand | `Our Little Universe` |
| Greeting | `Hey Jennifer` |
| Support | `Four questions so I know what you'd love. Then I plan the night.` |
| CTA | `Tear here — tell me what you'd love` |

Component: [`src/components/NightTicketLanding.tsx`](../src/components/NightTicketLanding.tsx)

**Reserved alternate:** Quiet Letter at `?variant=B` (dev only).

---

## 4. Screen: Quest wizard

### Shared chrome

- Top: `← Back to the beginning` (cream/75 → amber hover)
- Fixed universe badge
- `ProgressStars` — upcoming translucent cream; active amber; completed cream; stroke deep
- `QuestionCard` shell = cream ticket panel
- Bottom: text Back | primary Next (deep → amber hover)

### Choice selection

| State | Spec |
|---|---|
| Default | cream ticket panel |
| Selected | amber border + soft amber glow (`.selected`) |
| Focus-visible | amber ring |
| Pills | `.choice-pill` / `.selected` amber fill, deep border |

### Food step IA

- Cuisine stamps as the primary choice (Vietnamese, Sushi, Mexican, …)
- Optional craving note — cuisine, note, or both completes the step
- No food-category cards (home / out / takeout / café)

### Date step

- `.date-ticket` cream stubs; selected amber; weekend sparkle amber
- Countdown chip: deep fill, cream type, amber star

---

## 5. Screen: Celebration — keepsake reveal

1. `← Change an answer` (jumps to last quest step)
2. Eyebrow `ALL SET` (amber) + H1 `Here's What I Planned`
3. Date as dusk display type
4. Artful three-line verse (vibe / food / lock) — not the logistics summary sentence
5. Cream plan card: choice-labeled rows (vibe, food, when, hint) — tap/Edit jumps to that quest step
6. Primary `Save our night` below the card (until locked)

Post-lock: love letter card → Copy note | Add to calendar → More options disclosure.

Component: [`src/components/CelebrationReveal.tsx`](../src/components/CelebrationReveal.tsx)

No boarding-pass ticket, constellation block, or couple art on this screen.

---

## 6. Screen: Locked landing

Same dusk + cream ticket for constellation. Eyebrows amber. Anticipation quotes amber marks. Primary CTA deep/amber.

---

## 7. Component: Whisper modal

- Scrim: `bg-night-deep/70`
- Card: cream ticket (`.sticker-card`)
- Couple art below actions, no overlap
- Focus restore + Escape unchanged

---

## 8. Action hierarchy ladder

| Level | Treatment | Examples |
|---|---|---|
| Primary | `.pill-button.primary` (deep → amber hover) | Next, Save our night, Add to calendar |
| Secondary | `.pill-button.secondary` (cream / deep border) | Copy note, Save image |
| Tertiary | underline cream/75 → amber | Back, More options |
| Destructive | quieter underline; confirm() | Clear everything |

---

## 9–12. Content, a11y, responsive, edge cases

Unchanged from polish pass (storage, Love Brief, restaurant completion, reduced motion). Remap any remaining pink/purple contrast notes to night cream/amber/deep.

---

## 13. File map

| Area | Files |
|---|---|
| Tokens / primitives | `src/index.css` |
| First-visit landing | `src/components/NightTicketLanding.tsx` |
| Quest / lock / whisper | `src/App.tsx` |
| Celebration reveal | `CelebrationReveal.tsx` |
| Quest card / progress / dates | `QuestionCard.tsx`, `ProgressStars.tsx`, `DateSelector.tsx` |
| Constellation | `src/lib/constellation.ts`, `ConstellationMap.tsx` (locked landing + keepsake) |
| Quiet Letter alternate | `src/prototype/reimagine/` |

---

## 14. Acceptance criteria

1. First visit is Night Ticket; brand reads as hero in ≤2 seconds.
2. Quest / locked / whisper share dusk + cream ticket + amber accent; celebration uses dusk + cream plan card (no boarding-pass ticket).
3. Celebration keepsake order preserved; choice rows edit back into the quest; post-lock uses More options.
4. Progress stars and selection states use amber/cream/deep only.
5. Confetti and constellation use night palette.
6. Quiet Letter remains available at `?variant=B` in dev only.
7. Love Brief long-press and storage behavior unchanged.
