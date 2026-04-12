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
  idle: 'border-border hover:border-primary hover:bg-surface-alt hover:scale-[1.01] cursor-pointer',
  selected: 'border-primary bg-primary/10 ring-2 ring-primary/30',
  correct: 'border-success bg-success/10 ring-2 ring-success/30 animate-pulse',
  wrong: 'border-error bg-error/10 ring-2 ring-error/30 animate-shake',
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
        'w-full flex items-start gap-3 p-3 md:p-4 rounded-lg border-2 transition-all text-left',
        'min-h-[44px] md:min-h-[48px] disabled:cursor-not-allowed',
        stateStyles[state]
      )}
    >
      <span
        className={cn(
          'flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center font-bold text-sm',
          state === 'correct' && 'bg-success text-white',
          state === 'wrong' && 'bg-error text-white',
          state !== 'correct' && state !== 'wrong' && 'bg-surface-alt text-text'
        )}
      >
        {optionLabels[option]}
      </span>
      <span className="flex-1 text-sm md:text-base text-text">{text}</span>
    </button>
  );
}