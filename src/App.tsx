import { AssociationRound } from './components/AssociationRound';
import { CompletionPage } from './components/CompletionPage';
import { InformationPage } from './components/InformationPage';
import { Instructions } from './components/Instructions';
import { LandingPage } from './components/LandingPage';
import { PracticeRound } from './components/PracticeRound';
import { ResultChoice } from './components/ResultChoice';
import { ResultPage } from './components/ResultPage';
import { RoundTransition } from './components/RoundTransition';
import { useActivityEngine } from './hooks/useActivityEngine';

export default function App() {
  const engine = useActivityEngine();
  const { actions } = engine;

  switch (engine.phase) {
    case 'landing':
      return (
        <LandingPage
          onStart={actions.startActivity}
          onClearSession={actions.clearMySession}
          sessionClearedNotice={engine.sessionClearedNotice}
        />
      );

    case 'information':
      return (
        <InformationPage
          acknowledged={engine.acknowledged}
          onAcknowledge={actions.acknowledge}
          onContinue={actions.continueFromInformation}
          onBack={actions.returnHome}
        />
      );

    case 'instructions':
      return (
        <Instructions
          onStartPractice={actions.startPractice}
          onBack={actions.returnHome}
          prefersReducedMotion={engine.prefersReducedMotion}
        />
      );

    case 'practice':
      return <PracticeRound engine={engine} />;

    case 'round1':
    case 'round2':
      return <AssociationRound engine={engine} />;

    case 'transition':
      return <RoundTransition engine={engine} />;

    case 'resultChoice':
      return <ResultChoice onShow={actions.showResult} onSkip={actions.skipResult} />;

    case 'result':
      return <ResultPage activity={engine.activity} result={engine.result} onContinue={actions.continueFromResult} />;

    case 'completion':
      return (
        <CompletionPage
          onStartAgain={actions.restart}
          onClearSession={actions.clearMySession}
          onReturnHome={actions.returnHome}
          prefersReducedMotion={engine.prefersReducedMotion}
        />
      );

    default:
      return null;
  }
}
