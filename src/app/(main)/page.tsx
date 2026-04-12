'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '~/components/ui/button';
import { matematicaM2Questions } from '~/data/paes-questions/matematica-m2';
import { matematicaM1Questions } from '~/data/paes-questions/matematica-m1';
import { historiaQuestions } from '~/data/paes-questions/historia';
import { cienciasBiologiaQuestions } from '~/data/paes-questions/ciencias-biologia';
import { cienciasQuimicaQuestions } from '~/data/paes-questions/ciencias-quimica';
import { cienciasFisicaQuestions } from '~/data/paes-questions/ciencias-fisica';
import { competenciaLectoraQuestions } from '~/data/paes-questions/competencia-lectora';
import type { QuestionItem } from '~/types/domain';

const SUBJECTS = [
  'Comprension Lectora',
  'Matematica M1',
  'Matematica M2',
  'Historia',
  'Ciencias',
] as const;

const QUESTION_COUNTS = [10, 20, 35, 65];

const QUESTIONS: Record<string, QuestionItem[]> = {
  'Matematica M1': matematicaM1Questions,
  'Matematica M2': matematicaM2Questions,
  'Historia': historiaQuestions,
  'Ciencias': [
    ...cienciasBiologiaQuestions,
    ...cienciasQuimicaQuestions,
    ...cienciasFisicaQuestions,
  ],
  'Comprension Lectora': competenciaLectoraQuestions,
};

export default function HomePage() {
  const router = useRouter();
  const [subject, setSubject] = useState<string>('Matematica M1');
  const [count, setCount] = useState<number>(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCount = (s: string) => (QUESTIONS[s] || []).length;

  const handleStart = () => {
    if (getCount(subject) === 0) {
      setError(`No hay preguntas para ${subject}. Próximamente.`);
      return;
    }
    setLoading(true);
    const qs = QUESTIONS[subject] || [];
    const shuffled = [...qs].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const sessionData = { id: sessionId, subject, questionCount: count, questions: selected, currentIndex: 0, answers: [], startedAt: new Date().toISOString() };
    localStorage.setItem(`session_${sessionId}`, JSON.stringify(sessionData));
    router.push(`/simulacion/${sessionId}`);
  };

  return (
    <div className="space-y-6 md:space-y-8 px-4 md:px-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl md:text-3xl font-bold text-text">Nueva Simulación</h1>
        <p className="text-text-muted mt-2 text-sm md:text-base">Elige la materia y cuántas preguntas quieres responder.</p>
      </div>
      <div className="animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <h2 className="text-sm font-semibold text-text uppercase tracking-wide mb-3">Materia</h2>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((s, i) => (
            <Button 
              key={s} 
              variant={subject === s ? 'default' : 'outline'} 
              size="sm" 
              className="text-xs sm:text-sm transition-all duration-200"
              onClick={() => setSubject(s)}
            >
              {s} ({getCount(s)})
            </Button>
          ))}
        </div>
      </div>
      <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
        <h2 className="text-sm font-semibold text-text uppercase tracking-wide mb-3">Preguntas</h2>
        <div className="flex gap-2">
          {QUESTION_COUNTS.map((n) => (
            <Button 
              key={n} 
              variant={count === n ? 'default' : 'outline'} 
              size="sm" 
              className="min-w-[44px] min-h-[44px] transition-all duration-200"
              onClick={() => setCount(n)}
            >
              {n}
            </Button>
          ))}
        </div>
      </div>
      <div className="pt-2 md:pt-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
        <Button 
          className="w-full h-12 md:h-14 text-base md:text-lg transition-all duration-200" 
          onClick={handleStart} 
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Cargando...
            </span>
          ) : 'Iniciar Simulación'}
        </Button>
        {error && <p className="text-red-500 text-center mt-3 animate-fade-in">{error}</p>}
      </div>
    </div>
  );
}