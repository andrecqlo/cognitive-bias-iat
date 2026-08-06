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
| 1 | Landing | What an IAT is, plus a picker for the available activities |
| 2 | Important information | Limitations, plus a required acknowledgement |
| 3 | Instructions | Short list and an interactive demonstration |
| 4 | Practice | 16 trials: Neurodivergent vs Neurotypical, then Competent vs Incompetent |
| 5 | Round 1 | 40 scored trials with one combined pairing |
| 6 | Transition | New pairings shown, 20 practice trials, then a manual start |
| 7 | Round 2 | 40 scored trials with the other combined pairing |
| 8 | Result choice | Show or skip, given equal weight |
| 9 | Result | Response-time pattern with its caveats, or straight to completion |
| 10 | Completion | Start again, clear session, or return home |

This is a shortened educational demonstration, not a seven-block research IAT.

Randomised once per session: which pairing comes first, and which pair of categories sits on the left.

### Result calculation

The activity computes a **D-score**, following the standard IAT scoring algorithm (Greenwald, Nosek &
Banaji, 2003):

```
D = (mean of Pairing A − mean of Pairing B) / SD of all usable responses across both rounds
```

The divisor is the spread of *that participant's own* responses. This is the point of the algorithm: it puts
a fast, consistent responder and a slow, erratic one on the same scale, so the same 30 ms gap can be a
strong result for one person and a slight one for another. No assumed value for anyone's response speed or
variability appears anywhere in the code.

A negative score means Pairing A (Neurodivergent + Incompetent) was the quicker round; positive means
Pairing B was.

#### What counts

Each trial records the time to the **correct** response, including time spent on a wrong answer first. The
activity requires the correct side before advancing, which is the design the D-score's built-in error
penalty assumes — so an error costs what it cost, no separate penalty is added, and **error trials stay in
the calculation**. Removing them would remove exactly the trials where the pairing was hardest.

Excluded: practice trials, the first four trials of each scored round, responses under 300 ms or over
10,000 ms, and trials affected by a tab switch, focus loss or a long browser pause.

The first four trials of each round come out because round 1 goes straight from single-category practice
into scoring while round 2 gets a combined warm-up first. Dropping the same opening trials from both rounds
puts them on equal footing without making the activity longer. Those trials are still shown, and still count
towards accuracy.

#### Bands

| \|D\| | Reported as |
| --- | --- |
| Under 0.15 | Little or none — no direction named |
| 0.15 – 0.34 | Slight |
| 0.35 – 0.64 | Moderate |
| 0.65 and above | Strong |

These are the conventional Project Implicit bands. **They describe how large a gap is, not how confident
anyone should be that it is real or that it would reappear tomorrow.** The bands cannot carry that, so the
result copy does: every result — including "little or none" — displays a note on the contribution of chance
and on the modest test-retest stability of this kind of activity.

That note sits **above** the result sentence, not below it, and is not behind a toggle. People read this page
alone, with nobody to add context, so the caveat has to arrive before the sentence it qualifies; underneath,
it reads as a footnote to a finding already accepted. For the same reason the D-score itself is behind a
"more detail" disclosure rather than printed on the page — a bare figure invites more precision than the
activity can support.

#### Quality flags

The result is flagged as limited when a round has fewer than 20 usable responses, first-response accuracy
falls below 70%, or more than 10% of responses arrive under 300 ms. The last is the standard subject-level
exclusion criterion; this activity flags rather than excludes, because someone who rushed still deserves to
see what their session produced and why it is not worth much.

#### Caveats worth keeping in view

- This is not the seven-block research IAT, so what it computes is a D-score *variant*, not a textbook D.
  The block structure differs and practice blocks are not pooled into the divisor.
- IAT test-retest reliability at the individual level is modest — reported correlations commonly sit in the
  0.3–0.5 range. An individual score is not stable across occasions, which is why the result copy says so.

## Data

There is no personal data in this activity, and therefore no special category data, whatever the topic:

- The activity **asks the participant nothing about themselves** — no name, no demographics, no
  self-identification. It scores how quickly words were matched to categories, and nothing else.
- **Nothing is transmitted.** There are no network calls in the application at all: no `fetch`, no
  `sendBeacon`, no analytics, no remote fonts or dynamic imports.
- **Nothing is retained.** The only persistence is `window.sessionStorage`, used so a mid-activity refresh
  does not lose progress. It is cleared when the activity completes and discarded when the tab closes.
  `sessionStorage.test.ts` asserts that nothing is ever written to `localStorage`.

Keep it that way. Adding a results endpoint, an analytics tag or a completion webhook would change this from
a page that computes something on the reader's own device into one that processes personal data about them —
a different proposition entirely, and the point at which the above stops being true.

## Configuration

Everything intended to be tuned lives in two files:

- `src/config/activityConfig.ts` — trial counts, reaction-time exclusions, D-score bands, quality
  thresholds, sequencing limits. These apply to every activity.
- `src/config/activities.ts` — the activities on offer: category labels, word lists and result sentences.

Page wording that does not vary by topic is in `src/config/content.ts`, separate from layout and logic.

## Adding an activity

The procedure, the block structure and the D-score are topic-independent, so a new topic is a new entry in
`src/config/activities.ts` and nothing else. The landing page picks up new entries automatically.

Categories are named by *slot* — `targetA`, `targetB`, `attributeA`, `attributeB` — rather than by subject.
Pairing A groups `targetA` with `attributeA`; Pairing B swaps the attributes over.

Four constraints on a new word set:

1. **Keep the structure 2×2.** Two contrasted targets and two contrasted attributes. Three categories, or a
   pair that is not a clean opposition, does not make an IAT.
2. **Every word must belong to exactly one category, obviously and immediately.** A word that plausibly fits
   two categories inflates response times and turns the score into noise. This is the usual way a home-made
   IAT fails.
3. **Match the lists on word length, syllable count and familiarity.** Otherwise part of what the activity
   measures is reading time. The existing neurodiversity lists are imperfect on this point — "ADHD" against
   "Accomplished", and one two-word term among single words — and that is worth fixing before it is copied.
4. **Target words must not carry the attributes' valence.** A target word that is itself flattering or
   unflattering means the activity measures that instead.

Choosing a topic is not a data protection question — see [Data](#data) below for why. What a topic does
carry is the experience of reading the result alone, which is what the acknowledgement, the skippable result
and the chance note exist for. Weigh a new topic against those.

## Project structure

```
src/
  components/     screens, response zones, shared UI primitives
  config/         activities and their word lists, tunable numbers, page wording
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

### GitHub Pages

This is the deployment path in use. `.github/workflows/deploy.yml` tests, builds and publishes on every
push to `main`.

1. In the repository, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push to `main`, or run the workflow manually from the **Actions** tab.
4. The site appears at `https://<user>.github.io/<repository>/`.

Asset paths are relative (`base: './'` in `vite.config.ts`), so the same build works at a domain root or in
a repository subpath. A private repository needs a paid plan to publish with Pages.

Pages serves static files only and cannot set response headers, so the `noindex` meta tag in `index.html`
is the sole protection against search indexing. A published site is world-readable and Pages offers no
authentication on any plan — treat the URL as the only barrier, and share it directly with participants
rather than posting it somewhere durable.

### Vercel

Kept as an alternative. `vercel.json` is inert on Pages but applies if the repository is imported at
[vercel.com/new](https://vercel.com/new), where Vite is detected automatically. It sets
`X-Robots-Tag: noindex, nofollow` alongside `X-Frame-Options`, `X-Content-Type-Options` and
`Referrer-Policy` — header-level reinforcement that Pages cannot provide. Vercel builds without running the
test suite, so `.github/workflows/ci.yml` covers pull requests.

### Netlify or Cloudflare Pages

Build command `npm run build`, publish directory `dist`. No other configuration is needed.

## Design notes

Type is Aptos with a system fallback stack. Colour is Slate Grey `#282D37` with Signal Orange `#FF6223` as
the accent; cards use an 8px radius and buttons 4px, with flat fills rather than gradients or shadows. The
result comparison uses one colour for both bars so that length, not colour, carries the comparison.
