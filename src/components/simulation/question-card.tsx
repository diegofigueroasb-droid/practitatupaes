'use strict';

import { cn } from '~/lib/utils';

interface QuestionCardProps {
  prompt: string;
  className?: string;
}

export function QuestionCard({ prompt, className }: QuestionCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface p-6 shadow-sm',
        className
      )}
    >
      <p className="text-lg text-text leading-relaxed whitespace-pre-wrap">{prompt}</p>
    </div>
  );
}