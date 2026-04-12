'use strict';

interface ProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export function ProgressBar({ current, total, className }: ProgressBarProps) {
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className={className}>
      <div className="flex justify-between text-sm text-text-muted mb-2">
        <span>
          Pregunta {current} de {total}
        </span>
        <span className="font-medium">{Math.round(percentage)}%</span>
      </div>
      <div className="h-2 md:h-3 bg-surface-alt rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-300 rounded-full"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}