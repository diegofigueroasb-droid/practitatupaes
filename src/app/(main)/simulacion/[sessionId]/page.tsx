'use strict';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '~/trpc/react';
import { QuestionCard } from '~/components/simulation/question-card';
import { AlternativeButton } from '~/components/simulation/alternative-button';
import { ProgressBar } from '~/components/simulation/progress-bar';
import { Button } from '~/components/ui/button';
import type { AnswerOption, QuestionItem } from '~/types/domain';

const ALTERNATIVES: AnswerOption[] = ['A', 'B', 'C', 'D', 'E'];

export default function SimulationPage({ params }: { params: { sessionId: string } }) {
  const router = useRouter();
  const { data: session, isLoading } = api.session.getById.useQuery({ id: params.sessionId });
  const completeMutation = api.session.complete.useMutation({
    onSuccess: () => router.push('/historial'),
  });

  if (isLoading || !session || !session.questions || (session.questions as unknown[]).length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-text-muted">Preparando preguntas...</p>
        </div>
      </div>
    );
  }

  const questions = (session.questions ?? []) as unknown as QuestionItem[];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null);
  const [answers, setAnswers] = useState<Array<{ questionId: string; selectedAlternative: AnswerOption; isCorrect: boolean }>>([]);
  const phase = selectedAnswer ? 'feedback' : 'active';
  const currentQuestion = questions[currentIndex]!;

  const selectAnswer = (answer: AnswerOption) => setSelectedAnswer(answer);

  const advance = () => {
    if (!currentQuestion) return;
    
    const isCorrect = selectedAnswer === currentQuestion.correctAlternative;
    const newAnswers = [...answers, {
      questionId: currentQuestion.id,
      selectedAlternative: selectedAnswer!,
      isCorrect,
    }];

    if (currentIndex + 1 >= questions.length) {
      completeMutation.mutate({ id: session.id, answers: newAnswers });
    } else {
      setAnswers(newAnswers);
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
    }
  };

  const getAlternativeState = (key: AnswerOption): 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed' => {
    if (phase !== 'feedback') return selectedAnswer === key ? 'selected' : 'idle';
    if (key === currentQuestion.correctAlternative) return 'correct';
    if (key === selectedAnswer) return 'wrong';
    return 'dimmed';
  };

  return (
    <div className="space-y-6 pb-20">
      <ProgressBar current={currentIndex + 1} total={questions.length} />

      <div className="text-center">
        <span className="text-sm text-primary font-medium">{session.subject}</span>
      </div>

      <QuestionCard prompt={currentQuestion.prompt} />

      <div className="space-y-3">
        {ALTERNATIVES.map((key) => {
          const alt = currentQuestion.alternatives.find((a) => a.key === key);
          if (!alt) return null;
          return (
            <div key={key}>
              <AlternativeButton
                option={key}
                text={alt.text}
                state={getAlternativeState(key)}
                onPress={() => selectAnswer(key)}
                disabled={phase === 'feedback'}
              />
              {phase === 'feedback' && (key === currentQuestion.correctAlternative || key === selectedAnswer) && (
                <p className="text-sm text-text-muted mt-2 ml-2">
                  {currentQuestion.explanationsByAlternative[key]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {phase === 'feedback' && (
        <div className="pt-4">
          <Button className="w-full h-12" onClick={advance}>
            {currentIndex + 1 < questions.length ? 'Siguiente' : 'Ver Resultados'}
          </Button>
        </div>
      )}
    </div>
  );
}