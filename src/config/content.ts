/**
 * All page copy lives here, separate from layout and logic, so wording can
 * be reviewed or changed without touching component code.
 *
 * The reading pages are deliberately short. Every sentence a participant has to
 * read before starting is a sentence they may skim instead, and the ones that
 * matter most are the limitations — those survive trimming ahead of anything
 * else.
 */
/**
 * Listed with the other information-page points and named separately below, so
 * the required accessibility statement stays findable without the sentence
 * being written out twice.
 */
const ACCESSIBILITY_NOTE = 'It relies on timed visual sorting, which will not suit everyone.';

export const CONTENT = {
  landing: {
    heading: 'Hidden Associations',
    /**
     * ## The vocabulary, fixed
     *
     * **"Unconscious bias"** is the term throughout — not "subconscious", not
     * "cognitive bias", not "implicit bias". One noun across every screen, so a
     * reader is never wondering whether three names mean three things.
     * `content.test.ts` fails the build if the others reappear.
     *
     * **"Examining"**, never "detecting", "determining" or "measuring". The
     * activity does not find a thing that is there; it gives you something to
     * look at. That word carries the whole difference between a prompt and a
     * diagnosis.
     *
     * The register the copy has to hold, on every screen: not diagnostic, not
     * reliable on its own, but worth looking at — and the reflection it prompts
     * is the point rather than the result it produces. Each leg is carried
     * somewhere: "not a verdict" here, "none is a diagnosis" on the picker,
     * "a different day could give a different result" on the result page.
     */
    subtitle: 'Examining unconscious biases using the Brief Implicit Association Test.',
    intro:
      'This activity looks at how quickly you link certain ideas. This can help us examine our unconscious biases — associations we often hold without realising. Results shift with mood, fatigue and repetition, and a single score is a poor predictor of how you actually behave. Treat it as a prompt to reflect, not a verdict.',
    chooseHeading: 'Choose an activity',
    /**
     * The reliability framing is not repeated here: the intro three lines above
     * already carries it, and saying it twice on one screen reads as a
     * disclaimer rather than as a caution worth reading.
     */
    chooseHint: 'Each one examines a different set of hidden associations you might hold. None is a diagnosis.',
    facts: ['Takes 4–6 minutes', 'Works on mobile and desktop', 'No sign-up', 'Your result stays on your device'],
    startButton: 'Start',
    /** The one explainer on the page: what the method is and what you will do.
     * Split across two toggles it repeated itself. */
    howItWorksToggle: 'How does this work?',
    howItWorks:
      'Two categories are named on screen, and you say as quickly as you can whether the word in the middle belongs to one of them. One of the two stays the same throughout; the other swaps between rounds. There are four short rounds, plus a warm-up that does not count. Most people are quicker when the pair matches an association they already hold, and comparing those speeds is what this does. At the end you choose whether to see your own comparison — it names which pairing you were quicker on, not how large the difference was.',
    referencesToggle: 'Where to read more',
    referencesHint: 'These open in a new tab, on sites outside this one.',
    /**
     * Two public-facing links and the papers that matter most: the one that
     * introduced this shorter form of the method, the one whose scoring
     * procedure this activity follows, and the meta-analysis behind the caution
     * above about predicting behaviour. Titles, authors and years verified
     * against Crossref; do not add a reference without checking it resolves.
     */
    references: [
      {
        title: 'Project Implicit',
        detail: 'Take other versions of the test, run by the research group that developed it.',
        url: 'https://implicit.harvard.edu/implicit/',
      },
      {
        title: 'Project Implicit: frequently asked questions',
        detail: 'Plain-language answers on what a result does and does not tell you.',
        url: 'https://implicit.harvard.edu/implicit/faqs.html',
      },
      {
        title: 'Sriram & Greenwald (2009)',
        detail: 'The paper that introduced the Brief IAT, in Experimental Psychology.',
        url: 'https://doi.org/10.1027/1618-3169.56.4.283',
      },
      {
        title: 'Nosek, Bar-Anan, Sriram & Greenwald (2014)',
        detail: 'The scoring procedure this activity follows, in PLOS ONE.',
        url: 'https://doi.org/10.1371/journal.pone.0110938',
      },
      {
        title: 'Oswald et al. (2013)',
        detail: 'A meta-analysis finding that test scores predict discriminatory behaviour only weakly.',
        url: 'https://doi.org/10.1037/a0032734',
      },
    ],
  },
  information: {
    heading: 'Before you begin',
    /**
     * The consent gate, so it carries only what consent needs: what the
     * activity is not, the two things that might make someone decide not to
     * start, and where their responses go.
     */
    points: [
      'This is a short demonstration — it cannot diagnose bias, prejudice, neurodivergence or personality.',
      'Negative words such as “incapable” appear during the activity.',
      ACCESSIBILITY_NOTE,
      'Nothing is uploaded or shared with an employer, facilitator or site owner.',
    ],
    accessibilityNote: ACCESSIBILITY_NOTE,
    acknowledgement: 'I understand this is a brief educational activity, not a validated assessment.',
    continueButton: 'Continue',
    checkboxHint: 'Select the box above to continue.',
    backButton: 'Back',
  },
  /**
   * Shown before the instructions, and so before any trial. The words
   * themselves live on each activity; only the chrome is here.
   *
   * This screen is part of the procedure rather than background reading. A word
   * met for the first time in the middle of a block is classified slowly
   * because it is unfamiliar, not because of any association, and that slowness
   * lands in the score.
   */
  definitions: {
    heading: 'What these words mean',
    intro:
      'These four categories appear as headings throughout, and the words beside them are the ones you will be sorting. Read them before you start.',
    columns: {
      category: 'Category',
      meaning: 'What it means',
      words: 'Words you will see',
    },
    continueButton: 'Continue',
    backButton: 'Back',
  },
  instructions: {
    heading: 'How it works',
    points: [
      'Each round names two categories to watch for.',
      'A word appears in the middle of the screen.',
      'Tap the right side if it belongs to one of the two, and the left side if it does not.',
      'Go quickly, but get it right — a wrong tap has to be corrected before you continue.',
      'One of the two categories changes between rounds.',
    ],
    demoCaption: 'Try it now:',
    demoWatchFor: 'Watch for:',
    demoStimulus: 'skilled',
    demoFocalCategories: ['Neurodivergent', 'Competent'],
    demoHint: 'This is one of them, so it belongs on the right.',
    demoCorrect: 'That’s it. “skilled” is a “Competent” word, so you tap the right side.',
    demoIncorrect:
      'In the activity you would correct this before moving on. “skilled” is a “Competent” word, one of the two to watch for, so it goes on the right.',
    demoReset: 'Reset demonstration',
    startPracticeButton: 'Try a warm-up round',
  },
  warmUp: {
    tapHint: 'Tap or click a side to respond',
    readyHeading: 'You’re ready. The activity starts now.',
    readyBody:
      'Nothing so far has been counted. From here there are four short rounds, and the two categories to watch for change between them — the screen tells you each time.',
    beginButton: 'Begin activity',
    incorrectHint: 'Not quite — choose the correct side to continue.',
  },
  round: {
    tapHint: 'Tap or click a side to respond',
    keyboardHint: 'Keyboard: E or ← for left, I or → for right',
    /** The left-hand response: everything that is not one of the two focal categories. */
    nonFocalLabel: 'Anything else',
    watchForLabel: 'Watch for',
  },
  blockIntro: {
    heading: 'Watch for these two',
    body: 'Tap the right side when the word belongs to one of them, and the left side for anything else.',
    changedNote: 'One of the two has changed since the last round.',
    startButton: 'Start this round',
  },
  interruption: {
    message: 'It looks like the activity was interrupted. You can continue, but some responses may not be counted.',
    dismiss: 'Continue',
  },
  resultChoice: {
    heading: 'Your result is ready',
    body: 'It stays in this browser session. Nothing is stored, uploaded or visible to anyone else.',
    showButton: 'Show my result',
    skipButton: 'Skip my result',
  },
  result: {
    heading: 'Your result',
    /**
     * A third state the two below cannot cover: too little usable data to
     * compare anything. Without it the page would render a direction off a
     * null score.
     */
    incomplete: 'There were not enough usable responses to compare the two halves of the activity.',
    /**
     * The two states a scored result can take, chosen by the same threshold the
     * scoring uses. `{attribute}` is the focal attribute, `{faster}` and
     * `{slower}` the two targets — templated rather than written per activity so
     * every topic is worded identically.
     *
     * No size word appears in either, and the score itself is never printed.
     */
    lean: 'In this sitting, your responses leaned towards pairing {attribute} with {faster} more readily than with {slower}.',
    similar: 'In this sitting, your responses showed little difference either way.',
    /**
     * Shown on every result, whatever the outcome, and placed *above* the
     * result sentence rather than below it. People read this page alone, with
     * nobody to add context, so the caveat has to arrive before the sentence it
     * qualifies — underneath, it reads as a footnote to a finding they have
     * already accepted. Do not move it below, and do not hide it behind a
     * toggle.
     */
    caveatHeading: 'Before you read this',
    caveat:
      'One sitting is a rough measure — a different day could give a different result. No result here, in any direction, certifies anyone as biased or bias-free. Nothing from this activity has been saved or shared; this result exists only on this screen.',
    /** The specific causes are listed underneath, so this must not name one. */
    qualityWarning:
      'Something about this session makes the comparison less dependable than usual. Treat it as a rough impression.',
    comparisonHeading: 'Response time comparison',
    /** `{category}` is a target label, `{attribute}` the focal attribute. */
    barCaption: 'Blocks focusing on {category} + {attribute}',
    gap: 'You were about {seconds} seconds faster when {category} and {attribute} were your focus.',
    /**
     * Deliberately not "within the range chance would produce". Nothing here
     * computes a null distribution or an interval, and 0.15 is a conventional
     * effect-size boundary rather than a significance threshold. What a score
     * under it actually means is this: the gap is small next to how much the
     * participant's own times varied. Say that, and no more.
     */
    gapSimilar:
      'Your two averages were close together next to how much your response times varied overall — too close for this activity to read anything into.',
    /** Guards a gap that rounds to 0.00 seconds from claiming to be nothing. */
    gapBelowResolution: 'less than 0.01',
    sections: [
      {
        toggle: 'Why does speed matter?',
        body: 'Sorting is quicker when the two categories on screen already sit together in your mind: the link is well practised, so less effort goes into holding it. When they sit less easily together, the same task takes a fraction longer. That difference is what this activity compares. It reflects what you have been exposed to — language, media, who you have worked alongside — rather than what you believe, and a reaction time cannot tell you which of the two it has picked up.',
      },
      {
        toggle: 'Where might associations show up at work?',
        body: 'Rarely in what anyone says. More often in small, fast decisions nobody deliberates over: who gets offered the stretch project, whose estimate is taken at face value, how quickly a request for an adjustment is agreed, whose idea gets built on and whose gets restated by someone else first. The useful question is not whether you hold an association, but where a quick judgement might be doing work that a slower one would do better.',
      },
    ],
    continueButton: 'Continue',
  },
  completion: {
    heading: 'Activity complete',
    body: 'Thank you for taking part. This activity exists to prompt reflection about how quickly associations form — not to judge or label anyone.',
    startAgainButton: 'Start again',
    clearSessionButton: 'Clear my session',
    homeButton: 'Return to home',
  },
} as const;
