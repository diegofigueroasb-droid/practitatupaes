'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { api } from '~/trpc/react';

const SUBJECTS = [
  'Comprension Lectora',
  'Matematica M1',
  'Matematica M2',
  'Historia',
  'Ciencias',
] as const;

const MODE_LABELS = {
  'Ensayo oficial': { label: 'Ensayo Oficial', desc: 'Preguntas del banco oficial DEMRE' },
  'Repaso errores': { label: 'Repaso Errores', desc: 'Revisa tus respuestas incorrectas' },
} as const;

const QUESTION_COUNTS = {
  'Ensayo oficial': [10, 20, 35, 65] as const,
  'Repaso errores': [3, 5, 10] as const,
} as const;

export default function HomePage() {
  const router = useRouter();
  const [subject, setSubject] = useState<string>(SUBJECTS[0]);
  const [mode, setMode] = useState<'Ensayo oficial' | 'Repaso errores'>('Ensayo oficial');
  const [count, setCount] = useState<number>(10);
  const [error, setError] = useState<string | null>(null);

  const createSession = api.session.create.useMutation({
    onSuccess: (session) => {
      router.push(`/simulacion/${session.id}`);
    },
    onError: (err) => {
      setError(err.message);
    },
  });

  const handleStart = () => {
    createSession.mutate({ subject, mode, questionCount: count });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text">Nueva Simulación</h1>
        <p className="text-text-muted mt-2">
          Elige la materia, el modo y cuántas preguntas quieres responder.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-text uppercase tracking-wide mb-3">Materia</h2>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((s) => (
            <Button
              key={s}
              variant={subject === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSubject(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-text uppercase tracking-wide mb-3">Modo</h2>
        <div className="grid grid-cols-2 gap-4">
          {(Object.keys(MODE_LABELS) as Array<keyof typeof MODE_LABELS>).map((m) => (
            <Card
              key={m}
              className={`p-4 cursor-pointer transition-colors ${
                mode === m ? 'border-primary bg-primary/5' : ''
              }`}
              onClick={() => {
                setMode(m);
                setCount(QUESTION_COUNTS[m][0]);
              }}
            >
              <h3 className={`font-semibold ${mode === m ? 'text-primary' : ''}`}>
                {MODE_LABELS[m].label}
              </h3>
              <p className="text-sm text-text-muted mt-1">{MODE_LABELS[m].desc}</p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-text uppercase tracking-wide mb-3">Preguntas</h2>
        <div className="flex gap-2">
          {QUESTION_COUNTS[mode].map((n) => (
            <Button
              key={n}
              variant={count === n ? 'default' : 'outline'}
              size="sm"
              onClick={() => setCount(n)}
            >
              {n}
            </Button>
          ))}
        </div>
      </div>

      <div className="pt-4">
        <Button
          className="w-full h-14 text-lg"
          onClick={handleStart}
          disabled={createSession.isPending}
        >
          {createSession.isPending ? 'Preparando...' : 'Iniciar Simulación'}
        </Button>
        {error && <p className="text-red-500 text-center mt-3">{error}</p>}
      </div>
    </div>
  );
}