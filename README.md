# Hidden Associations: Neurodiversity Edition

A short, private web activity that explores automatic associations between neurodivergence and perceived
competence. It takes around 2–3 minutes, runs entirely in the browser, and collects nothing.

## What this is, and what it is not

This is a brief educational demonstration built for workplace conversations about neurodiversity. It is
**not** a validated psychological assessment, a clinical or diagnostic test, an employee evaluation, a
research instrument, or evidence that anyone holds a particular belief.

The activity reports only an observed response-time pattern from one short session on one device. It never
describes a participant as biased, prejudiced or inclusive, produces no score, and does not rank
participants or neurodevelopmental conditions against each other.

## Privacy

- No backend, database, authentication, API routes or analytics.
- No personal information and no reaction-time data leaves the device.
- Activity state is held in React state, with a copy in `sessionStorage` so a refresh does not lose the
  acknowledgement or a finished result. `localStorage` is never used.
- Stored state is removed when the activity completes, and a **Clear my session** control is available on
  the landing and completion screens.
- Refreshing mid-activity deliberately restarts the activity rather than resuming part-way, so no round is
  ever stitched together from two sittings.

## Running it locally

```bash
npm install
npm run dev      # development server
npm test         # unit and interaction tests
npm run build    # static production build into dist/
npm run preview  # serve the production build locally
```

Requires Node 20 or newer.

## How the activity is structured

| Step | Screen | Notes |
| --- | --- | --- |
| 1 | Landing | Overview, no hint about the expected direction of any association |
| 2 | Important information | Limitations, plus a required acknowledgement |
| 3 | Instructions | Short list and an interactive demonstration |
| 4 | Practice | 16 trials: Neurodivergent vs Neurotypical, then Competent vs Incompetent |
| 5 | Round 1 | 26 scored trials with one combined pairing |
| 6 | Transition | New pairings shown, 5 practice trials, then a manual start |
| 7 | Round 2 | 26 scored trials with the other combined pairing |
| 8 | Result choice | Show or skip, given equal weight |
| 9 | Result | Response-time pattern with its caveats, or straight to completion |
| 10 | Completion | Start again, clear session, or return home |

This is a shortened educational demonstration, not a seven-block research IAT.

Randomised once per session: which pairing comes first, and which pair of categories sits on the left.

### Result calculation

Median reaction times are compared between the two combined rounds. Excluded from the comparison:
practice trials, trials whose first response was incorrect, responses faster than 250 ms or slower than
5,000 ms, and trials affected by a tab switch, focus loss or a long browser pause. The result is flagged as
limited when a round has fewer than 12 usable trials or first-response accuracy below 70%. No D-score is
calculated.

## Configuration

Everything intended to be tuned lives in two files:

- `src/config/activityConfig.ts` — trial counts, reaction-time thresholds, quality thresholds, sequencing
  limits.
- `src/config/stimuli.ts` — the four category labels and their stimulus phrases.

Page wording is in `src/config/content.ts`, separate from layout and logic.

## Project structure

```
src/
  components/     screens, response zones, shared UI primitives
  config/         stimuli, tunable numbers, all page wording
  hooks/          activity state machine, timing, interruption detection
  utils/          trial generation, result calculation, session storage
  types/          shared activity types
```

Trial generation, timing, scoring, presentation and temporary storage are kept in separate modules.

## Accessibility

Built against WCAG 2.2 AA principles: large touch targets, full keyboard operation, visible focus states,
screen-reader labels on response zones, a logical heading structure, reduced-motion support, and no
information conveyed by colour alone. Browser zoom to 200% is not blocked.

The activity relies on timed visual categorisation, so it will not suit everyone. That limitation is stated
on the information screen rather than glossed over.

Keyboard shortcuts are optional: `E` or `←` for the left response, `I` or `→` for the right.

## Testing

```bash
npm test
```

Covers trial balancing and sequencing limits, pairing randomisation, left/right mapping, duplicate-stimulus
prevention, reaction-time exclusions, median and percentage-difference calculations, accuracy, result-quality
warnings, session clearing, restart behaviour, mouse/touch/keyboard responses, reduced motion, focus loss and
tab switching.

Responsive layouts were built mobile-first for narrow portrait, mobile landscape, tablet, laptop and large
desktop, and should be spot-checked on real devices before facilitated use.

## Deploying

The build output in `dist/` is a plain static site. No environment variables are required.

### Vercel

1. Push this repository to GitHub.
2. At [vercel.com/new](https://vercel.com/new), import the repository.
3. Vercel detects Vite automatically — build command `npm run build`, output directory `dist`.
4. Deploy. The free `*.vercel.app` URL is live immediately, and later pushes to `main` redeploy.

### GitHub Pages

`.github/workflows/deploy.yml` builds and publishes on every push to `main`.

1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main`, or run the workflow manually from the **Actions** tab.
4. The site appears at `https://<user>.github.io/<repository>/`.

Asset paths are relative (`base: './'` in `vite.config.ts`), so the same build works at a domain root or in a
repository subpath. Note that a private repository needs a paid plan to publish with Pages; Vercel deploys
private repositories on its free tier.

### Netlify or Cloudflare Pages

Build command `npm run build`, publish directory `dist`. No other configuration is needed.

## Design notes

Type is Aptos with a system fallback stack. Colour is Slate Grey `#282D37` with Signal Orange `#FF6223` as
the accent; cards use an 8px radius and buttons 4px, with flat fills rather than gradients or shadows. The
result comparison uses one colour for both bars so that length, not colour, carries the comparison.
