
import { useState, useEffect } from 'react';
import { TutorialState } from './types';

export function useTutorial(hasCompletedTutorial: boolean) {
  const [tutorial, setTutorial] = useState<TutorialState>({ 
    step: hasCompletedTutorial ? 0 : 1, 
    isActive: !hasCompletedTutorial 
  });

  const checkTutorialProgress = (localBlockAp: number, localAttackAp: number) => {
    if (!tutorial.isActive) return;

    const totalSpent = (localBlockAp * 1) + (localAttackAp * 2);

    if (tutorial.step === 2 && totalSpent > 0) {
      setTutorial(prev => ({ ...prev, step: 3 }));
    } else if (tutorial.step === 3 && totalSpent >= 2) {
      setTutorial(prev => ({ ...prev, step: 4 }));
    }
  };

  const advanceTutorial = () => {
    if (tutorial.step === 1) {
      setTutorial(prev => ({ ...prev, step: 2 }));
    }
  };

  const completeTutorial = () => {
    setTutorial({ step: 0, isActive: false });
    localStorage.setItem('protocol_has_completed_tutorial', 'true');
  };

  return {
    tutorial,
    setTutorial,
    checkTutorialProgress,
    advanceTutorial,
    completeTutorial
  };
}
