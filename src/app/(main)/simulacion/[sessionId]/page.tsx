'use client';

import { use, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { QuestionCard } from '~/components/simulation/question-card';
import { AlternativeButton } from '~/components/simulation/alternative-button';
import { ProgressBar } from '~/components/simulation/progress-bar';
import { Button } from '~/components/ui/button';
import type { AnswerOption, QuestionItem } from '~/types/domain';

const ALTERNATIVES: AnswerOption[] = ['A', 'B', 'C', 'D', 'E'];

const TOTAL_TIME_MS = 2 * 60 * 60 * 20 * 1000; // 2h20min in ms

interface Session {
  id: string;
  subject: string;
  questions: QuestionItem[];
  currentIndex: number;
  answers: { questionId: string; selectedAlternative: string; isCorrect: boolean }[];
  startedAt: string;
  endedAt?: string;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function SimulationPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = use(params);
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<AnswerOption | null>(null);
  const [answers, setAnswers] = useState<{ questionId: string; selectedAlternative: string; isCorrect: boolean }[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(TOTAL_TIME_MS);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(`session_${sessionId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setSession(parsed);
      setCurrentIndex(parsed.currentIndex || 0);
      setAnswers(parsed.answers || []);
      if (parsed.startedAt) {
        startTimeRef.current = new Date(parsed.startedAt).getTime();
        const elapsed = Date.now() - startTimeRef.current;
        setTimeRemaining(TOTAL_TIME_MS - elapsed);
      }
    } else {
      router.push('/');
    }
    setLoading(false);
  }, [sessionId, router]);

  useEffect(() => {
    if (loading || timeRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = TOTAL_TIME_MS - elapsed;
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        if (session) {
          const updatedSession = { ...session, endedAt: new Date().toISOString() };
          localStorage.setItem(`session_${sessionId}`, JSON.stringify(updatedSession));
        }
        router.push(`/result/${sessionId}`);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, session, sessionId, router, timeRemaining]);

  if (loading || !session || !session.questions || session.questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center animate-fade-in">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-text-muted">Cargando preguntas...</p>
        </div>
      </div>
    );
  }

  const questions = session.questions;
  const currentQuestion = questions[currentIndex]!;
  const phase = selectedAnswer ? 'feedback' : 'active';

  const selectAnswer = (answer: AnswerOption) => {
    setSelectedAnswer(answer);
    setTimeout(() => setShowFeedback(true), 50);
  };

  const advance = () => {
    if (!currentQuestion || !session) return;

    setIsTransitioning(true);
    const isCorrect = selectedAnswer === currentQuestion.correctAlternative;
    const newAnswers = [...answers, {
      questionId: currentQuestion.id,
      selectedAlternative: selectedAnswer!,
      isCorrect,
    }];

    const newIndex = currentIndex + 1;
    const isLast = newIndex >= questions.length;

    if (isLast) {
      const finishedSession = {
        ...session,
        currentIndex: newIndex,
        answers: newAnswers,
        endedAt: new Date().toISOString(),
      };
      localStorage.setItem(`session_${sessionId}`, JSON.stringify(finishedSession));
      router.push(`/result/${sessionId}`);
      return;
    }

    const updatedSession = {
      ...session,
      currentIndex: newIndex,
      answers: newAnswers,
    };

    setTimeout(() => {
      setAnswers(newAnswers);
      setCurrentIndex(newIndex);
      setSelectedAnswer(null);
      setShowFeedback(false);
      setSession(updatedSession);
      localStorage.setItem(`session_${sessionId}`, JSON.stringify(updatedSession));
      setIsTransitioning(false);
    }, 300);
  };

  const getAlternativeState = (key: AnswerOption): 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed' => {
    if (phase !== 'feedback') return selectedAnswer === key ? 'selected' : 'idle';
    if (key === currentQuestion.correctAlternative) return 'correct';
    if (key === selectedAnswer) return 'wrong';
    return 'dimmed';
  };

  const timerColor = timeRemaining < 5 * 60 * 1000 ? 'text-red-600' : timeRemaining < 15 * 60 * 1000 ? 'text-yellow-600' : 'text-text';

  return (
    <div className={`space-y-4 md:space-y-6 pb-20 px-4 md:px-0 ${isTransitioning ? 'opacity-0 transition-opacity duration-300' : 'animate-fade-in'}`}>
      <ProgressBar current={currentIndex + 1} total={questions.length} />

      <div className="flex justify-between items-center">
        <span className="text-sm text-primary font-medium">{session.subject}</span>
        <span className={`text-base md:text-lg font-mono font-bold ${timerColor} animate-pulse`}>
          {formatTime(timeRemaining)}
        </span>
      </div>

      <div className={`transition-all duration-300 ${showFeedback ? 'animate-scale-in' : ''}`}>
        <QuestionCard prompt={currentQuestion.prompt} />
      </div>

      <div className="space-y-3">
        {ALTERNATIVES.map((key, i) => {
          const alt = currentQuestion.alternatives.find((a) => a.key === key);
          if (!alt) return null;
          return (
            <div 
              key={key} 
              className={`transition-all duration-300 ${showFeedback ? 'animate-fade-in-up' : ''}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <AlternativeButton
                option={key}
                text={alt.text}
                state={getAlternativeState(key)}
                onPress={() => selectAnswer(key)}
                disabled={phase === 'feedback'}
              />
              {phase === 'feedback' && (key === currentQuestion.correctAlternative || key === selectedAnswer) && (
                <p className="text-sm text-text-muted mt-2 ml-2 animate-fade-in">
                  {currentQuestion.explanationsByAlternative?.[key]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {phase === 'feedback' && (
        <div className="pt-2 md:pt-4 animate-fade-in-up">
          <Button className="w-full h-12 md:h-14 text-base" onClick={advance}>
            {currentIndex + 1 < questions.length ? 'Siguiente' : 'Ver Resultados'}
          </Button>
        </div>
      )}
    </div>
  );
}