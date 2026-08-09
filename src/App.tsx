import { BlockIntro } from './components/BlockIntro';
import { CompletionPage } from './components/CompletionPage';
import { DefinitionsPage } from './components/DefinitionsPage';
import { InformationPage } from './components/InformationPage';
import { Instructions } from './components/Instructions';
import { LandingPage } from './components/LandingPage';
import { ResultChoice } from './components/ResultChoice';
import { ResultPage } from './components/ResultPage';
import { ScoredBlock } from './components/ScoredBlock';
import { WarmUpRound } from './components/WarmUpRound';
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

    case 'definitions':
      return (
        <DefinitionsPage
          activity={engine.activity}
          onContinue={actions.continueFromDefinitions}
          onBack={actions.returnHome}
        />
      );

    case 'instructions':
      return (
        <Instructions
          onStartWarmUp={actions.startWarmUp}
          onBack={actions.returnHome}
          prefersReducedMotion={engine.prefersReducedMotion}
        />
      );

    case 'warmUp':
      return <WarmUpRound engine={engine} />;

    case 'blockIntro':
      return <BlockIntro engine={engine} />;

    case 'block':
      return <ScoredBlock engine={engine} />;

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
