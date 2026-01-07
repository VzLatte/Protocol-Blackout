
import { useState, useEffect } from 'react';
import { TutorialState } from '../types';
import { ATTACK_CONFIG, BLOCK_CONFIG } from '../constants';

export function useTutorial(hasCompletedTutorial: boolean) {
  const [tutorial, setTutorial] = useState<TutorialState>({ 
    step: hasCompletedTutorial ? 0 : 1, 
    isActive: !hasCompletedTutorial 
  });

  // Updated to not auto-advance during text phases (1-3)
  const checkTutorialProgress = (localBlockAp: number, localAttackAp: number) => {
    // Logic moved to explicit advancement in View for smoother UX
    // Keeping this function signature for compatibility if needed elsewhere
  };

  const advanceTutorial = () => {
    setTutorial(prev => ({ ...prev, step: prev.step + 1 }));
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
