'use client';

import { use, useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '~/components/ui/button';
import type { AnswerOption, QuestionItem } from '~/types/domain';

interface Session {
  id: string;
  subject: string;
  questions: QuestionItem[];
  currentIndex: number;
  answers: { questionId: string; selectedAlternative: string; isCorrect: boolean }[];
  startedAt: string;
  endedAt?: string;
}

export default function ResultPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(`session_${sessionId}`);
    if (stored) {
      setSession(JSON.parse(stored));
    }
    setLoading(false);
    setTimeout(() => setIsVisible(true), 100);
  }, [sessionId]);

  if (loading || !session) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-text-muted">Cargando resultados...</p>
        </div>
      </div>
    );
  }

  const questions = session.questions || [];
  const answers = session.answers || [];

  const timeTaken = session.endedAt && session.startedAt
    ? new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()
    : 0;

  const formatTimeTaken = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  };

  const avgTimePerQuestion = questions.length > 0
    ? Math.round(timeTaken / questions.length)
    : 0;

  const formatAvgTime = (ms: number): string => {
    const seconds = Math.round(ms / 1000);
    return `${seconds}s`;
  };

  const countByDifficulty: Record<string, { correct: number; total: number }> = {
    easy: { correct: 0, total: 0 },
    medium: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
  };

  const countByExclude: { correct: number; total: number } = { correct: 0, total: 0 };

  questions.forEach((q, idx) => {
    const answer = answers[idx];
    const difficulty = q.difficulty || 'medium';
    const excluded = q.metadata?.excludedFromScore ?? false;

    if (countByDifficulty[difficulty]) {
      countByDifficulty[difficulty].total++;
      if (answer?.isCorrect) {
        countByDifficulty[difficulty].correct++;
      }
    }

    if (excluded) {
      countByExclude.total++;
      if (answer?.isCorrect) {
        countByExclude.correct++;
      }
    }
  });

  const answerScore = answers.filter(a => {
    const q = questions.find(q => q.id === a.questionId);
    return q && !(q.metadata?.excludedFromScore ?? false);
  });

  const scoreEligibleCount = answerScore.length;
  const scoreEligibleCorrect = answerScore.filter(a => a.isCorrect).length;
  const percentageAdjusted = scoreEligibleCount > 0
    ? (scoreEligibleCorrect / scoreEligibleCount) * 100
    : 0;

  const officialScore = Math.round(150 + (percentageAdjusted / 100) * 700);

  const correctCount = answers.filter(a => a.isCorrect).length;
  const incorrectAnswers = answers.filter(a => !a.isCorrect);
  const totalCount = questions.length;
  const rawPercentage = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;

  const handleReview = () => {
    router.push(`/simulacion/${sessionId}?review=true`);
  };

  return (
    <div className={`space-y-6 md:space-y-8 px-4 md:px-0 transition-opacity duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="text-center animate-fade-in-up">
        <h1 className="text-2xl md:text-3xl font-bold text-text">Resultados</h1>
        <p className="text-text-muted mt-2">{session.subject}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 text-center">
        <div className="p-4 bg-primary/10 rounded-lg animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="text-2xl md:text-3xl font-bold text-primary">{officialScore}</div>
          <div className="text-sm text-text-muted">Puntaje Oficial</div>
        </div>
        <div className="p-4 bg-green-100 rounded-lg animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="text-2xl md:text-3xl font-bold text-green-600">{correctCount}</div>
          <div className="text-sm text-text-muted">Correctas</div>
        </div>
        <div className="p-4 bg-red-100 rounded-lg animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="text-2xl md:text-3xl font-bold text-red-600">{incorrectAnswers.length}</div>
          <div className="text-sm text-text-muted">Incorrectas</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 rounded-lg animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="text-sm text-text-muted mb-1">Tiempo Total</div>
          <div className="text-xl font-semibold text-text">{formatTimeTaken(timeTaken)}</div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
          <div className="text-sm text-text-muted mb-1">Promedio por Pregunta</div>
          <div className="text-xl font-semibold text-text">{formatAvgTime(avgTimePerQuestion)}</div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 rounded-lg animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
        <div className="text-sm text-text-muted mb-3">Rendimiento por Dificultad</div>
        <div className="space-y-2">
          {Object.entries(countByDifficulty).map(([diff, { correct, total }]) => (
            total > 0 && (
              <div key={diff} className="flex items-center gap-3">
                <span className="text-sm text-text-muted w-16 capitalize">{diff}</span>
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all duration-700 ease-out"
                    style={{ width: isVisible ? `${(correct / total) * 100}%` : '0%' }}
                  />
                </div>
                <span className="text-sm font-medium text-text w-12 text-right">
                  {correct}/{total}
                </span>
              </div>
            )
          ))}
        </div>
      </div>

      {countByExclude.total > 0 && (
        <div className="p-4 bg-yellow-50 rounded-lg animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
          <div className="text-sm text-yellow-800 mb-1">Preguntas Piloto (no cuentan)</div>
          <div className="text-lg font-semibold text-yellow-900">
            {countByExclude.total - countByExclude.correct} incorrectas de {countByExclude.total}
          </div>
        </div>
      )}

      <div className="p-4 bg-gray-50 rounded-lg text-center animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
        <div className="text-sm text-text-muted">% Aciertos (scored)</div>
        <div className="text-2xl font-bold text-text">{Math.round(percentageAdjusted)}%</div>
        <div className="text-xs text-text-muted mt-1">
          {scoreEligibleCorrect} de {scoreEligibleCount} preguntas que cuentan
        </div>
      </div>

      {incorrectAnswers.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-text mb-4 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>Explicaciones</h2>
          <div className="space-y-4">
            {answers.map((answer, index) => {
              if (answer.isCorrect) return null;
              const question = questions.find(q => q.id === answer.questionId);
              if (!question) return null;

              return (
                <div key={answer.questionId} className="p-4 border rounded-lg animate-fade-in-up" style={{ animationDelay: `${1 + index * 0.1}s` }}>
                  <div className="font-medium text-sm text-text-muted mb-2">
                    Pregunta {index + 1}
                    {(question.metadata?.excludedFromScore ?? false) && (
                      <span className="ml-2 text-xs text-yellow-600">(piloto)</span>
                    )}
                    {question.difficulty && (
                      <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
                        question.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                        question.difficulty === 'hard' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {question.difficulty}
                      </span>
                    )}
                  </div>
                  <div className="text-text mb-3">{question.prompt}</div>
                  <div className="text-sm">
                    <span className="text-red-600">Tu respuesta: {answer.selectedAlternative}</span>
                    <span className="mx-2">→</span>
                    <span className="text-green-600">Correcta: {question.correctAlternative}</span>
                  </div>
                  {question.explanationsByAlternative?.[question.correctAlternative] && (
                    <div className="mt-2 text-sm text-text-muted p-2 bg-primary/5 rounded">
                      {question.explanationsByAlternative[question.correctAlternative]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button className="flex-1 h-12 min-h-[48px] animate-fade-in-up" style={{ animationDelay: '1.1s' }} onClick={handleReview}>
          Revisar Preguntas
        </Button>
        <Button className="flex-1 h-12 min-h-[48px] animate-fade-in-up" style={{ animationDelay: '1.2s' }} variant="outline" onClick={() => router.push('/')}>
          Nueva Simulación
        </Button>
      </div>
    </div>
  );
}