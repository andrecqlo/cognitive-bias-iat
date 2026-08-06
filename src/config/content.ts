/**
 * All page copy lives here, separate from layout and logic, so wording can
 * be reviewed or changed without touching component code.
 *
 * The reading pages are deliberately short. Every sentence a participant has to
 * read before starting is a sentence they may skim instead, and the ones that
 * matter most are the limitations — those survive trimming ahead of anything
 * else.
 */
export const CONTENT = {
  landing: {
    heading: 'Hidden Associations',
    subtitle: 'Short activities based on the Implicit Association Test.',
    intro:
      'Some pairs of ideas feel more connected than others, and that shows up in how quickly you can sort them. These activities measure that, and are designed to prompt reflection rather than to label or judge you.',
    whatIsIatToggle: 'What is an Implicit Association Test?',
    whatIsIat:
      'An Implicit Association Test asks you to sort words into categories as fast as you can, then changes which categories share a button. Most people are quicker when the pairing matches an association they already hold, and that difference in speed is what gets measured. It says nothing about what you believe or how you behave—only about how quickly certain ideas came together on one occasion. Scores are not stable: people who repeat one often get a different answer.',
    chooseHeading: 'Choose an activity',
    chooseHint: 'Each one uses the same method with a different set of words.',
    facts: ['Takes 5–7 minutes', 'Works on mobile and desktop', 'No sign-up', 'Your result stays on your device'],
    startButton: 'Start',
    howItWorksToggle: 'How does this work?',
    howItWorks:
      'You sort words into categories as quickly as you can. The category pairings change part-way through. At the end you choose whether to see a private comparison of your response times.',
  },
  information: {
    heading: 'Before you begin',
    points: [
      'This is a brief educational demonstration, not a validated psychological assessment.',
      'It cannot diagnose bias, prejudice, neurodivergence or personality.',
      'Results shift with attention, tiredness, reading speed, how familiar the words feel, your device, and the order you happen to see things in.',
      'Negative words such as “Inept” appear during the activity.',
      'Nothing is uploaded or shared with an employer, facilitator or site owner.',
    ],
    accessibilityNote:
      'The activity relies on timed visual sorting, which will not suit everyone.',
    acknowledgement: 'I understand this is a brief educational activity, not a validated assessment.',
    continueButton: 'Continue',
  },
  instructions: {
    heading: 'How it works',
    points: [
      'A word appears in the middle of the screen.',
      'Tap or click the side whose category it belongs to.',
      'Go quickly, but get it right — a wrong tap has to be corrected before you continue.',
      'The category pairings change part-way through.',
    ],
    demoCaption: 'Try it now:',
    demoStimulus: 'Proficient',
    demoLeftCategory: 'Competent',
    demoRightCategory: 'Incompetent',
    demoHint: 'This belongs on the left.',
    demoCorrect: 'That’s it. “Proficient” belongs with “Competent”, so you tap the left side.',
    demoIncorrect: 'In the activity you would correct this before moving on. “Proficient” belongs with “Competent”, on the left.',
    demoReset: 'Reset demonstration',
    startPracticeButton: 'Try a practice round',
  },
  practice: {
    tapHint: 'Tap or click a side to respond',
    readyHeading: 'You’re ready. The categories will now appear together.',
    beginButton: 'Begin activity',
    incorrectHint: 'Not quite — choose the correct side to continue.',
  },
  round: {
    tapHint: 'Tap or click a side to respond',
    keyboardHint: 'Keyboard: E or ← for left, I or → for right',
  },
  transition: {
    heading: 'Nice work—the categories are switching.',
    body: 'Take a moment to notice the new positions before continuing.',
    practiceLabel: 'A few practice trials with the new pairing:',
    startFinalButton: 'Start final round',
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
    /** The topic-specific sentences live on each activity; this one does not vary. */
    incomplete: 'There were not enough usable responses to compare the two pairings.',
    strengths: {
      slight: 'slightly',
      moderate: 'moderately',
      strong: 'markedly',
    },
    /**
     * Shown on every result, whatever the outcome, and placed *above* the
     * result sentence rather than below it. People read this page alone, with
     * nobody to add context, so the caveat has to arrive before the sentence it
     * qualifies — underneath, it reads as a footnote to a finding they have
     * already accepted. Do not move it below, and do not hide it behind a
     * toggle: the bands describe how large a gap is and can say nothing at all
     * about how much to trust it.
     */
    chanceNoteHeading: 'Before you read this',
    chanceNote:
      'Some of what follows is chance. A short activity like this is not a stable measure of a person—repeat it another day and many people land somewhere different. Response times also move with attention, tiredness, reading speed, how familiar the words feel, your device, and which pairing you happened to see first.',
    disclaimer:
      'This does not mean you consciously hold any particular belief about neurodivergent people. It describes your response times during one short activity, and nothing more.',
    whatDoesThisMeanToggle: 'What does this mean?',
    whatDoesThisMean:
      'Quick associations are shaped by language, culture, media and everyday experience. They are not the same thing as your beliefs, your behaviour or your character, and a reaction-time activity cannot tell you which of those you have. The useful question is not “what does my score say about me?” but “where might associations like these come from, and where might they show up at work?”',
    /** The specific causes are listed underneath, so this must not name one. */
    qualityWarning:
      'Something about this session makes the comparison less dependable than usual. Treat it as a rough impression.',
    /**
     * The number itself sits behind this toggle rather than on the page. A
     * bare "0.42" invites more precision than the activity can support, and a
     * reader on their own has nobody to tell them otherwise.
     */
    scoreToggle: 'More detail: how the strength is worked out',
    scoreExplanation:
      'This activity is scored with a D-score, the standard measure for this kind of task. It compares your two rounds against how much your own response times varied, so a quick, consistent responder and a slower, more erratic one can be described on the same scale—the same gap in milliseconds can be a strong result for one person and a slight one for another.',
    scoreBandsIntro: 'The wording above comes from where your score falls:',
    scoreBands: [
      'Under 0.15 — little or none',
      '0.15 to 0.34 — slight',
      '0.35 to 0.64 — moderate',
      '0.65 and above — strong',
    ],
    scoreCaveat:
      'These labels describe how large a gap is. They say nothing about whether it would appear again if you took the activity a second time.',
    scoreYours: 'Your score',
    comparisonHeading: 'Response time comparison',
    detailHeading: 'Round detail',
    differenceLabel: 'Difference between pairings',
    labels: {
      meanRow: 'Average response time',
      accuracyRow: 'Right first time',
      usableRow: 'Responses counted',
      meanPrefix: 'Average response time',
    },
    continueButton: 'Continue',
  },
  completion: {
    heading: 'Activity complete',
    body: 'Thank you for taking part. This activity exists to prompt reflection about how quickly associations form—not to judge or label anyone.',
    startAgainButton: 'Start again',
    clearSessionButton: 'Clear my session',
    homeButton: 'Return to home',
  },
} as const;
