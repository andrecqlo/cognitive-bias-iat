# Hidden Associations: Neurodiversity Edition

A short, private web activity that explores automatic associations between neurodivergence and perceived
competence. It takes 4–6 minutes, runs entirely in the browser, and collects nothing.

The procedure is a **Brief IAT** (Sriram & Greenwald, 2009), scored by the recommended algorithm in Nosek,
Bar-Anan, Sriram & Greenwald (2014).

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

The participant is shown two **focal** categories and answers one question per trial: does this word belong
to one of those two, or not? The focal response is the right-hand side, everything else is the left. One
attribute stays focal throughout and the target swaps between blocks — that contrast is the whole measure.

| Step | Screen | Notes |
| --- | --- | --- |
| 1 | Landing | What the method is, plus a picker for the available activities |
| 2 | Important information | Limitations, plus a required acknowledgement |
| 3 | Definitions | A table of each category, what it means, and the words it will use |
| 4 | Instructions | Short list and an interactive demonstration |
| 5 | Warm-up | 12 unscored trials — every word once, before anything counts |
| 6–9 | Four scored blocks | 20 trials each, announced by a screen naming the focal pair |
| 10 | Result choice | Show or skip, given equal weight |
| 11 | Result | Response-time direction with its caveats, or straight to completion |
| 12 | Completion | Start again, clear session, or return home |

The definitions screen is part of the procedure, not background reading. A word met for the first time in
the middle of a block is classified slowly because it is unfamiliar rather than because of any association,
and that slowness lands in the score. It sits before the instructions so the category names the
demonstration uses have already been explained. Its words column is generated from `stimuli`, so it cannot
fall out of step with what the trials show.

The warm-up is 12 trials because there are 12 words, and it shows **each of them exactly once**. That works
only because the warm-up skips the leading attribute-only run that opens a scored block — it is never
scored, so it has nothing to discard, and straight alternation splits its trials evenly between targets and
attributes. Keep the leading run at the same length and the warm-up becomes two thirds attributes, with one
word from each target category never appearing. `generateTrials.test.ts` asserts the exact-once property
over 100 generated warm-ups.

This is shorter than the 16 trials of the published procedure — exact coverage of the word lists, bought
with two fewer rehearsals of the mechanic itself.

92 trials in total. The four scored blocks alternate the focal target and are read as two consecutive
**pairs**, each yielding its own D; the two are averaged, so the second pair acts as a replication of the
first rather than as more of the same data.

Randomised once per session: which target is focal first. The focal side is fixed at the right-hand key,
matching the published procedure the reliability figures come from.

Why a BIAT rather than a shortened seven-block IAT: truncating a full IAT is the one approach with explicit
guidance against it — Greenwald et al. (2022) warn that reliability suffers when trial counts are cut below
the recommended numbers — whereas the BIAT is short by construction and ranked marginally ahead of the full
IAT across 29 criteria in Bar-Anan & Nosek's (2014) comparison of seven indirect measures.

### Result calculation

The activity computes a **D-score** for each block pair and averages them:

```
D(pair) = (mean of targetA-focal block − mean of targetB-focal block) / SD of all scored responses in the pair
D        = mean of the two pair scores
```

The divisor is the spread of *that participant's own* responses. This is the point of the algorithm: it puts
a fast, consistent responder and a slow, erratic one on the same scale, so the same 30 ms gap can be a
strong result for one person and a slight one for another. No assumed value for anyone's response speed or
variability appears anywhere in the code.

A negative score means the blocks with Neurodivergent focal were the quicker ones; positive means
Neurotypical.

#### What counts

Each trial records the time to the **correct** response, including time spent on a wrong answer first. The
activity requires the correct side before advancing, which is the design the D-score's built-in error
penalty assumes — so an error costs what it cost, no separate penalty is added, and **error trials stay in
the calculation**. Removing them would remove exactly the trials where the focal pair was hardest.

The scoring steps, in order:

1. Drop warm-up trials, and any trial affected by a tab switch, focus loss or a long browser pause.
2. Drop responses over 10,000 ms.
3. Drop the first four trials of **every** block.
4. Keep error trials.
5. Recode responses under 400 ms up to 400 ms, and over 2,000 ms down to 2,000 ms.
6. Compute D per block pair, then average.

Steps 2 to 5 are the recommended BIAT procedure. Note that step 5 *recodes* rather than excludes: a very
fast response is usually anticipation and a very slow one usually inattention, but the participant was still
on that trial, so recoding keeps the trial and removes only its leverage over the mean.

The four dropped trials at the head of each block are the attribute-only run every block opens with. They
are still shown, and still count towards accuracy.

#### Good-focal

The **positive** attribute is the one held focal. This is not cosmetic: good-focal and bad-focal blocks are
structurally identical, and good-focal blocks carry roughly three times the shared variance (Nosek et al.,
2014). `ActivityDefinition.focalAttribute` must point at the positive attribute — pointing it at the
unflattering one would throw away most of the measure while looking like it still worked.

#### Direction only

There is one threshold, not four bands:

| \|D\| | Reported as |
| --- | --- |
| Under 0.15 | About the same speed either way — no direction named |
| 0.15 and above | The quicker pair is named, with no size attached |

**The conventional slight / moderate / strong labels are deliberately absent.** They are effect-size
conventions describing how large a gap is, and one sitting of a short activity cannot support a size. A
reader on their own has nobody to tell them that a "moderate" is not a moderate anything. Naming which way
the response times ran is the most this can carry, so it is all it says — and the D-score figure is not
printed either, behind a disclosure or otherwise, because a bare number is a size by another route.

What the page does show is the two response-time means and the gap in milliseconds. Those are descriptive
rather than interpretive, and they are what makes the result discussable.

Every result — including "about the same" — displays a note on the contribution of chance and on the modest
test-retest stability of this kind of activity. That note sits **above** the result sentence, not below it,
and is not behind a toggle. People read this page alone, with nobody to add context, so the caveat has to
arrive before the sentence it qualifies; underneath, it reads as a footnote to a finding already accepted.

#### Quality flags

The result is flagged as limited when a focal target has fewer than 20 usable responses, first-response
accuracy falls below 70%, more than 10% of responses arrive under 300 ms, or only one of the two block pairs
could be scored. The 10%/300 ms rule is the standard subject-level exclusion criterion; this activity flags
rather than excludes, because someone who rushed still deserves to see what their session produced and why
it is not worth much.

#### Caveats worth keeping in view

- Test-retest reliability for this family of measures is modest: r ≈ .50 across 58 studies, against internal
  consistency of α ≈ .80 across 257 (Greenwald et al., 2022). Around half the variance in a single sitting
  does not reappear on another occasion. An individual score is not stable, which is why the result copy
  says so.
- The BIAT's own internal consistency in the good-focal condition is α ≈ .753, and it correlates r ≈ .645
  with a full IAT of the same construct.
- Order effects are real and not fully removed here. The published finding is that a pairing looks
  *stronger* when it is met first, because carryover from the previous mapping outweighs general practice.
  This activity alternates the focal target across four blocks and averages two pairs, which dilutes the
  effect rather than eliminating it.
- The warm-up mirrors the first scored block's focal pair, which gives that pairing slightly more exposure
  than the other. A coin flip decides which pairing that is.
- Three stimuli per category is at the low end of published BIAT practice. Each word repeats more often
  within a block, so stimulus learning sets in faster and one weak word contaminates a third of its
  category. Accepted in exchange for every individual word being familiar.

## Before facilitated use

Three checks are worth running with a small pilot group:

1. **Classification speed and error rates per category.** Confirm the two-word neuromajority phrases are not
   disproportionately error-prone. Slower on its own is acceptable and expected.
2. **Error rates on the incompetent side.** The in-/un- prefixes offer a partial visual shortcut. If sorting
   there looks suspiciously fast, swap one item for "inept" or "careless".
3. **Review with neurodivergent colleagues.** Representation is limited to ADHD, autism and dyslexia; the
   language is identity-first; and the pairings appear on screen in full. All three are worth a conversation
   before anyone meets them cold.

Checks 1 and 2 need per-category timing data that this activity deliberately does not retain — nothing is
stored or transmitted, by design. Getting that data means either a facilitated session where someone
observes, or a temporary instrumented build that is not the one you ship. Do not add retention to the
production build to satisfy a pilot; see [Data](#data).

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

- `src/config/activityConfig.ts` — block counts and lengths, latency exclusions and the recoding window,
  D-score bands, quality thresholds, sequencing limits. These apply to every activity.
- `src/config/activities.ts` — the activities on offer: category labels, word lists, which attribute is
  focal, and result sentences.

Two numbers there are deliberately equal and should move together: `blocks.leadingAttributeTrials` (the
attribute-only run each block opens with) and `leadingTrialsDropped` (what scoring discards). They describe
the same four trials from the composition side and the scoring side.

Page wording that does not vary by topic is in `src/config/content.ts`, separate from layout and logic.

## Adding an activity

The procedure, the block structure and the D-score are topic-independent, so a new topic is a new entry in
`src/config/activities.ts` and nothing else. The landing page picks up new entries automatically.

Categories are named by *slot* — `targetA`, `targetB`, `attributeA`, `attributeB` — rather than by subject.
`focalAttribute` names whichever attribute slot holds the **positive** attribute; that one stays focal in
every block while the two targets take turns beside it.

Six constraints on a new word set. The first four are enforced by `content.test.ts`; the last two are
judgement.

1. **Point `focalAttribute` at the positive attribute.** See [Good-focal](#good-focal). Getting this
   backwards is the most expensive mistake available here, and the least visible.
2. **Define every stimulus** in `definitions`. Nothing may be read for the first time mid-block.
3. **Never use a category label as one of its own stimuli.** Those trials can be answered by matching the
   word in the middle against the identical label on screen, without classifying anything. This is why the
   neurodiversity activity labels a category `Neuromajority` and demotes "neurotypical" to a stimulus.
4. **Keep the structure 2×2 with equal-sized lists**, at least three words per category, no word appearing
   in two categories. A word that plausibly fits two categories inflates response times and turns the score
   into noise — the usual way a home-made IAT fails.
5. **Target words must not carry the attributes' valence.** A target word that is itself flattering or
   unflattering means the activity measures that instead. "Gifted" and "high-functioning" are excluded for
   this reason.
6. **Prefer familiarity over matched length.** The existing lists mix single words with two-word phrases,
   deliberately: a constant per-category speed handicap appears in both block types and largely cancels in
   the D-score, whereas padding every item into a matched phrase adds slowness and variance to every trial,
   which does not cancel. Read the rationale block above `NEURODIVERSITY` in `activities.ts` before
   "fixing" this.

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

Covers block composition and sequencing limits, focal/non-focal balancing within each dimension, block-order
counterbalancing, duplicate-stimulus prevention, latency exclusions and recoding, per-pair D calculation and
averaging, accuracy, result-quality warnings, session clearing, restart behaviour, mouse/touch/keyboard
responses, reduced motion, focus loss and tab switching.

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
