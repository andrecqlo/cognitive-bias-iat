# Design notes: why this is a Brief IAT

Working notes on the procedure this activity implements, why it is a Brief IAT rather than a shortened
seven-block IAT, and what remains imperfect. Most of it is derivable from the code and the README, but only
slowly, so the reasoning is written down here.

References throughout: Sriram & Greenwald (2009) for the BIAT; Nosek, Bar-Anan, Sriram & Greenwald (2014)
for the scoring procedure; Bar-Anan & Nosek (2014) for the comparative psychometrics; Greenwald et al.
(2022) for current IAT best practice.

## How it got here

The activity was originally a truncated seven-block IAT: 116 trials across five blocks, missing both the
combined practice before the first scored round (block 3) and the reversed single-category practice
(block 5). That design had two problems.

The first was that it was not a design anyone has validated. Greenwald et al. (2022) explicitly warn that
reliability suffers when "researchers opt to save time by reducing numbers of IAT trials below the numbers
recommended", which is precisely what a truncated IAT does. The seven-block procedure they recommend is
190 trials — 20/20/20/40/30/20/40.

The second was an asymmetry the design could not resolve. Round 1 went straight from single-category
practice into scoring while round 2 received 20 combined practice trials first, so the two scored rounds
did not start from the same place. `warmUpTrialsDropped: 4` was a cheap substitute for the missing block,
and four trials against a twenty-trial head start is not an equal trade.

The BIAT solves both by being short by construction rather than by truncation.

## Comparative standing

| Procedure | Trials | Internal consistency | Standing |
| --- | --- | --- | --- |
| Standard seven-block IAT | 190 | α ≈ .80 (257 studies) | Ranked 2.39 avg across 29 criteria — second |
| **Brief IAT** | **~96** | **α ≈ .753 (good-focal)** | **Ranked 2.34 — best of seven** |
| GNAT | short | lower | Third |
| ST-IAT / SC-IAT | short | lower | Fourth; measures a different construct |
| AMP / SPF / evaluative priming | short | AMP decent, EPT poor | Fifth to seventh |

Bar-Anan & Nosek (2014), N = 23,413, across race, politics and self-esteem. The BIAT correlates r ≈ .645
with a full IAT of the same construct and r ≈ .558 with self-report.

Test-retest reliability for the family sits at r ≈ .50 across 58 studies, against internal consistency of
α ≈ .80 across 257 (Greenwald et al., 2022). That ceiling constrains every row in the table. No choice of
procedure rescues it, and it is the single most important fact about any individual result this activity
produces.

## What the implementation does

**Structure.** A 12-trial unscored warm-up, then four scored blocks of 20 — 92 trials. Blocks alternate
which target is focal and are read as two consecutive pairs; each pair yields its own D and the two are
averaged.

**Warm-up length.** Set to the number of distinct words, so each is met exactly once before anything counts.
That property depends on the warm-up skipping the leading attribute-only run: it is never scored, so it has
nothing to discard, and straight alternation splits its trials evenly between the two dimensions. With the
scored blocks' composition, 12 trials would be 8 attribute and 4 target, and one word from each target
category would never appear. Shorter than the published 16 — exact coverage bought with two fewer
rehearsals of the mechanic.

**Focal mechanic.** Two categories are named; the participant answers whether the word belongs to one of
them. The focal response is the right-hand key, fixed for every session — the published procedure uses that
arrangement and the quoted reliability figures come from it, so randomising it would add variance for
nothing.

**Good-focal.** The positive attribute stays focal in every block. Good-focal and bad-focal blocks are
structurally identical, and good-focal carries roughly three times the shared variance. In this codebase
that is `ActivityDefinition.focalAttribute`, which for the neurodiversity activity points at `attributeB`
("Competent") — note that `attributeA` is the *negative* one, so the field cannot be assumed.

**Block composition.** Each block opens with four attribute-only trials, then alternates category and
attribute. Focal and non-focal are balanced *within* each dimension rather than across the block, so a block
cannot end up asking about one target more often than the other — that would read as a speed difference
having nothing to do with association.

**Scoring.** Drop warm-up and interrupted trials, drop responses over 10,000 ms, drop the first four trials
of every block, keep error trials, recode latencies into [400, 2000], then D per pair and average.

**Reporting.** Direction only. There is one threshold — |D| ≥ 0.15 names the quicker pair, below it the two
halves are reported as about the same — and no slight/moderate/strong labels, no band table, and no printed
D-score. Those labels are effect-size conventions describing the size of a gap, and one sitting of a short
activity cannot support a size. The response-time means and the millisecond gap are still shown: they are
descriptive rather than interpretive, and they are what makes the result discussable.

**Definitions before anything.** A table of every category, what it means and the words it will use, shown
before the instructions and so before the warm-up. A word met for the first time mid-block is classified
slowly because it is unfamiliar, and that slowness lands in the score as though it were an association. The
words column is generated from `stimuli`, so coverage is structural rather than checked; `content.test.ts`
still fails the build if a category has no explanation, or if a label also appears in its own word list.

## What is still imperfect

**Order effects are diluted, not removed.** The direction here is easy to get backwards. The naive account
says practice makes the second block faster; the published finding is the opposite. Greenwald et al. (2022)
report that the association appears *stronger* when its pairing came first — carryover interference from the
mapping just performed outweighs the general practice benefit. Alternating the focal target across four
blocks and averaging two pairs reduces the effect. It does not eliminate it.

**The warm-up favours the first pairing slightly.** It mirrors the first scored block's focal pair, which
spends the novelty of the mechanic and the word lists before anything counts, at the cost of giving that
pairing marginally more exposure. The alternative — meeting the target words for the first time in a scored
block — costs more. A coin flip decides which pairing benefits, and averaging two pairs dilutes what remains.

**Counterbalancing is by coin flip, not by design.** With nothing leaving the device there is no sample to
balance across, so randomisation is all that is available. Worth being clear about what that buys: for an
*individual* reading their own result, an order effect is a systematic push in one direction, and the coin
flip only decides which direction. Randomisation helps aggregates, and this activity has none.

**Three stimuli per category.** At the low end of published BIAT practice but within it. Each word repeats
more often within a block, so stimulus learning sets in faster and one weak word contaminates a third of its
category. Traded deliberately for every individual word being familiar.

**Mixed word lengths across the two target categories.** Single words against two-word phrases. Left alone
on purpose: a constant per-category speed handicap appears in both block types and largely cancels in the
D-score, whereas padding every item into a matched phrase ("autistic mind", "dyslexic learner") would add
uniform slowness and response-time variance to every trial, and that does not cancel. The rationale is in
`activities.ts` above the activity definition, because this is the change a future reader is most likely to
make in good faith.

**"ADHD" is visually salient among lowercase stimuli.** It is the only capitalised word in the set, which
may speed those trials for reasons having nothing to do with association. English has no standard adjective
form, so the alternatives are worse. Worth watching in the pilot.

**The in-/un- prefix shortcut.** Each incompetent word directly negates a competent one, which matches them
on length, frequency and semantic scope — at the cost of a partial visual shortcut to the incompetent
category. Retained because the pairing benefit outweighs it; swap one item for "inept" or "careless" if
piloting shows suspiciously fast sorting on that side.

**Nobody has timed a real run.** The 4–6 minute figure in the copy is built from 92 trials at conventional
latencies plus per-screen reading estimates. It is an order of magnitude, not a measurement.

## Duration estimate

92 trials. The only fixed delay in the trial loop is the 220 ms feedback pause before the next stimulus
(90 ms under reduced motion) — no fixation cross, no inter-trial interval — so a trial costs reaction time
plus 220 ms, and errors cost more because the recorded time runs to the *correct* response.

At conventional latencies that is roughly 1.5 to 2 minutes of tapping. The reading screens add more: landing
(~45 s including choosing an activity), information gate (~30 s), instructions plus the optional
demonstration (~35 s), warm-up ready screen (~10 s), four block announcements (~12 s each), result choice
(~10 s), result page (~40 s as shown, ~80 s with both disclosures open), completion (~10 s).

So: ~3 min for a fast participant, ~4.5 min typical, ~6.5 min for someone who reads the result page
properly. "4–6 minutes" in `content.ts` and the README covers that honestly.
