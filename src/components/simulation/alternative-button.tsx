'use strict';

import { cn } from '~/lib/utils';
import type { AnswerOption } from '~/types/domain';

type AlternativeState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed';

interface AlternativeButtonProps {
  option: AnswerOption;
  text: string;
  state: AlternativeState;
  onPress: () => void;
  disabled?: boolean;
}

const stateStyles: Record<AlternativeState, string> = {
  idle: 'border-border hover:border-primary hover:bg-surface-alt',
  selected: 'border-primary bg-primary/10',
  correct: 'border-success bg-success/10',
  wrong: 'border-error bg-error/10',
  dimmed: 'border-border opacity-40',
};

const optionLabels: Record<AnswerOption, string> = {
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
  E: 'E',
};

export function AlternativeButton({
  option,
  text,
  state,
  onPress,
  disabled,
}: AlternativeButtonProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      className={cn(
        'w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all text-left',
        'min-h-[48px] disabled:cursor-not-allowed',
        stateStyles[state]
      )}
    >
      <span
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm',
          state === 'correct' && 'bg-success text-white',
          state === 'wrong' && 'bg-error text-white',
          state !== 'correct' && state !== 'wrong' && 'bg-surface-alt text-text'
        )}
      >
        {optionLabels[option]}
      </span>
      <span className="flex-1 text-text">{text}</span>
    </button>
  );
}