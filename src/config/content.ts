/**
 * All page copy lives here, separate from layout and logic, so wording can
 * be reviewed or changed without touching component code.
 */
export const CONTENT = {
  landing: {
    heading: 'Hidden Associations',
    subtitle: 'A short interactive activity exploring neurodiversity and assumptions about competence.',
    intro:
      'Your brain makes rapid associations every day. This activity explores how quickly different ideas feel connected. It is designed to encourage reflection—not to label or judge you.',
    facts: ['Takes around 2–3 minutes', 'Works on mobile and desktop', 'No sign-up', 'Your result stays on your device'],
    startButton: 'Start activity',
    howItWorksToggle: 'How does this work?',
    howItWorks:
      'You will quickly sort a series of words and phrases into categories. The category combinations will change during the activity. At the end, you can choose whether to view a private comparison of your response times.',
  },
  information: {
    heading: 'Before you begin',
    points: [
      'This is a brief educational demonstration.',
      'It is not a validated psychological assessment.',
      'It does not diagnose bias, prejudice, neurodivergence or personality.',
      'The result is not a definitive measure of beliefs or behaviour.',
      'Results can be affected by attention, reading speed, motor speed, familiarity with terminology, device type, test order and the specific phrases used.',
      'No data is uploaded or sent to an employer, facilitator or website owner.',
      'Some negative descriptors will appear during the activity.',
    ],
    accessibilityNote:
      'This activity relies on timed visual categorisation and may not be suitable or accessible for everyone.',
    acknowledgement: 'I understand that this is a brief educational activity and not a validated psychological assessment.',
    continueButton: 'Continue',
  },
  instructions: {
    heading: 'How it works',
    points: [
      'A word or phrase will appear in the centre of the screen.',
      'Decide which category it belongs to.',
      'Tap or click the left or right side to respond.',
      'Respond quickly while trying to stay accurate.',
      'The category pairings will change between rounds.',
      'If you respond incorrectly, choose the correct side before continuing.',
    ],
    demoCaption: 'Try it now:',
    demoStimulus: 'Proficient',
    demoLeftCategory: 'Competent',
    demoRightCategory: 'Incompetent',
    demoHint: 'This belongs on the left.',
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
    message: 'It looks like the activity was interrupted. You can continue, but some trials may not be included in your comparison.',
    dismiss: 'Continue',
  },
  resultChoice: {
    heading: 'Your result is ready',
    body: 'Your result stays in this browser session. It is not stored, uploaded or visible to anyone else.',
    showButton: 'Show my result',
    skipButton: 'Skip my result',
  },
  result: {
    heading: 'Your result',
    /** {percent} is replaced with the percentage difference between pairings. */
    patterns: {
      fasterWithIncompetent:
        'During this activity, you categorised items {percent}% faster when “Neurodivergent” shared a response side with “Incompetent” than when it shared a side with “Competent.”',
      fasterWithCompetent:
        'During this activity, you categorised items {percent}% faster when “Neurodivergent” shared a response side with “Competent” than when it shared a side with “Incompetent.”',
      similar: 'Your response times were broadly similar across the two category pairings.',
      incomplete:
        'There were not enough usable responses in this session to compare the two category pairings.',
    },
    disclaimer:
      'This does not mean that you consciously hold a particular belief about neurodivergent people. It reflects your performance during one short activity and may be influenced by attention, familiarity, reading speed, motor speed, test order, your device and the particular phrases used.',
    whatDoesThisMeanToggle: 'What does this mean?',
    whatDoesThisMean:
      'Automatic associations can be influenced by language, culture, media, workplace experiences and familiarity. A brief reaction-time activity cannot define your beliefs, behaviour or character. Treat this result as a prompt for curiosity rather than a judgement.',
    qualityWarning:
      'Your responses varied more than usual during this activity, so this comparison is less reliable than usual. Treat it as a rough impression rather than a firm result.',
    labels: {
      medianA: 'Median response time — Neurodivergent + Incompetent pairing',
      medianB: 'Median response time — Neurodivergent + Competent pairing',
      accuracyA: 'Accuracy — Pairing A',
      accuracyB: 'Accuracy — Pairing B',
      usableA: 'Usable trials — Pairing A',
      usableB: 'Usable trials — Pairing B',
    },
  },
  completion: {
    heading: 'Activity complete',
    body: 'Thank you for taking part. This activity is intended to prompt reflection about how quickly people can form associations—not to judge or label anyone.',
    startAgainButton: 'Start again',
    clearSessionButton: 'Clear my session',
    homeButton: 'Return to home',
  },
} as const;
