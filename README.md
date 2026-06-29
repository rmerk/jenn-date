# Our Little Universe 💫
A playful, heartfelt date-planning gift for Jennifer — built with love in the warm, rounded, star-filled spirit of modern Korean pop cartoon aesthetics (BT21-inspired visual language, original characters only).

This is a single, self-contained romantic web experience. No logins, no backend, no accounts. Pure client-side joy.

## How Jennifer Opens This (for the husband)

### Quick dev preview (while building)
```bash
cd /Users/rchoi/Personal/jenn-date
npm install          # only needed once after fresh clone
npm run dev
```
Open the local URL (usually http://localhost:5173). Share your screen or let her visit on her phone via your local network IP (Vite prints it).

### For her to enjoy it forever (recommended)
1. Build the production version:
   ```bash
   npm run build
   ```
2. The `dist/` folder now contains a tiny static site (single HTML + assets).
3. Serve it anywhere static files work:
   - GitHub Pages, Vercel (drag & drop), Netlify, Cloudflare Pages, or even a simple USB key + a local web server on a laptop.
   - For the simplest "just open it" experience: use a tool like `serve` (`npx serve dist`) or any static host.
4. Send her the link or the built folder. When she opens it the first time it feels like a personal storybook adventure. If she already has a locked date in her browser storage, it greets her with the happy "Our Date Is Set!" screen.

Refresh-safe: everything lives in `localStorage` under the key `jenn-universtar-plan-v1`. She can clear it from the locked screen if she ever wants to re-dream the evening.

## Where to Customize the Love Note (the emotional heart)

**The single most important edit point:**

`src/lib/loveMessage.ts`

Open that file and replace the draft text with your real words — the exact message you want her to read the moment she locks the date. It receives the full plan object so you can reference the chosen date, her mascot, her vibe word, or any secret hint she shared.

Everything else (suggested activities, question wording, mascot personalities) is also easy to tweak in a handful of obvious files without touching animations or layout:

- `src/lib/questions.ts` — the 7 questions and their loving copy
- `src/lib/utils.ts` — `getConstellationIdeas()` for the 3–4 romantic activity prompts
- The six mascot SVG components in `src/components/mascots/` — colors, accessories, or expressions
- Tailwind classes + `src/index.css` for any last visual polish

## The Experience (what she will feel)

1. Warm landing with your voice: "My dearest Jennifer…"
2. A short, delightful 7-question quest (under 3 minutes on a phone). One question is choosing the actual date — presented as beautiful collectible "star chart" tickets.
3. A joyful "Mission Complete" celebration with the chosen UNIVERSTAR friends, a big locked date, personalized summary, and your handwritten-style love message.
4. She taps "Lock This Date in My Heart Forever" → confetti in our exact brand colors + hearts/stars, the plan is saved forever, and the real message appears.
5. Return visits always show the happy locked state with an option to tweak or clear.

## Mascots (original "UNIVERSTAR friends")

Six completely original characters created for this gift (no trademarks, no copies of any existing IP):

- **Luma** — dreamy star traveler with floating cyan scarf and orbiting companion star
- **Momo** — cozy sleepy cloud friend with moon pillow and cheek stars
- **Dodo** — round food-loving hugger with dumpling cheeks and tiny apron
- **Pipo** — energetic hoodie heart pup (your stand-in companion)
- **Hoppy** — brave strong bunny with one bold eyebrow and determined heart
- **Crumble** — silly wink cookie with chocolate freckles and playful crumbs

They react playfully on hover/tap and appear throughout the journey.

## Tech & Quality

- Vite + React + TypeScript
- Tailwind CSS v4 (zero-config via official Vite plugin)
- framer-motion for every meaningful springy, warm transition and mascot reaction
- canvas-confetti + sonner for celebration + gentle feedback
- lucide-react icons (heavily styled)
- 100% client-side. Mobile-first. Full keyboard + screen reader support. Respects `prefers-reduced-motion`. Zero console errors or layout shift.

Accessibility notes (already in place):
- Logical focus order and visible focus rings on every interactive element
- ARIA labels, live regions on progress, proper button roles
- All color combinations tested for high contrast on the playful palette
- Complete reduced-motion path (softer springs + no looping animations)

## Suggested Hero / Open Graph Image Concept

Create (or have an artist draw) a square or 1200×630 image with:
- Soft cream-to-sky gradient background
- Luma and Pipo floating among a gentle constellation of tiny yellow stars and pink hearts
- A glowing “event ticket” or heart-shaped plaque in the center reading in rounded playful lettering:
  “June XX • Jennifer & [Your Name]”
- Very subtle sparkle texture and one or two of the other mascots peeking from the edges
- Overall feeling: warm, collectible sticker sheet, storybook, unmistakably made for one person

This image can live in /public and be referenced in index.html for social sharing. Even a simple hand-drawn or Canva version will feel more personal than anything generic.

Built as a one-time, deeply personal love letter. The goal was maximum "you really know me and put thought into this" emotional impact.

If you're reading this years later: I hope the evening was as magical as the planning felt.

With all my heart,
— The husband who made this
