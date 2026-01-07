
import { useState } from 'react';
import { MoveIntent } from '../types';

export function usePlayerDraft(defaultTargetId?: string) {
  const [localBlockAp, setLocalBlockAp] = useState(0);
  const [localAttackAp, setLocalAttackAp] = useState(0);
  const [localMoveAp, setLocalMoveAp] = useState(0);
  const [localAbilityActive, setLocalAbilityActive] = useState(false);
  const [localMoveIntent, setLocalMoveIntent] = useState<MoveIntent | undefined>(undefined);
  const [localTargetId, setLocalTargetId] = useState<string | undefined>(defaultTargetId);

  const resetDraft = () => {
    setLocalBlockAp(0);
    setLocalAttackAp(0);
    setLocalMoveAp(0);
    setLocalAbilityActive(false);
    setLocalMoveIntent(undefined);
    setLocalTargetId(defaultTargetId);
  };

  return {
    localBlockAp, setLocalBlockAp,
    localAttackAp, setLocalAttackAp,
    localMoveAp, setLocalMoveAp,
    localAbilityActive, setLocalAbilityActive,
    localMoveIntent, setLocalMoveIntent,
    localTargetId, setLocalTargetId,
    resetDraft
  };
}
