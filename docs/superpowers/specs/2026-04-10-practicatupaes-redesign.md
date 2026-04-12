# PracticaTuPAES - Spec

## Overview
App para practicar simulaciones de PAES sin login. Usuario selecciona materia, hace simulación, y recibe explicaciones.

## Stack
- **Frontend**: Next.js 15
- **Backend**: Firebase (Firestore + Storage)
- **Storage**: localStorage para resultados
- **Auth**: Ninguno

## Routes

```
/                   → Home (selección materia/cantidad)
/simulacion/[id]     → Simulación activa
/result/[id]         → Resultado + explicaciones
```

## Data Model

### Firestore: questions
```typescript
{
  id: string;
  subject: 'Comprension Lectora' | 'Matematica M1' | 'Matematica M2' | 'Historia' | 'Ciencias';
  prompt: string;
  alternatives: { key: string; text: string }[];
  correctAlternative: string;
  explanationsByAlternative: Record<string, string>;
}
```

### localStorage: session
```typescript
{
  id: string;
  subject: string;
  questionCount: number;
  currentIndex: number;
  answers: { questionId: string; selected: string; isCorrect: boolean }[];
  startedAt: Date;
  completedAt?: Date;
  score?: number;
}
```

## Functionality

1. **Home**
   - Dropdown materia (5 opciones)
   - Botones cantidad: 10, 20, 35, 65
   - Botón "Iniciar Simulación"

2. **Simulación**
   - Mostrar pregunta actual
   - 5 alternativas (A-E)
   - Progress bar (pregunta X de Y)
   - Timer (opcional)
   - Botón "Siguiente"

3. **Resultado**
   - Score estimado
   - Listado de preguntas respondidas
   - Para cada incorrecta: alternativa elegida vs correcta + explicación
   - Botón "Nueva Simulación"

## Firebase Config
```typescript
// firebase.ts
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  // Tu config de Firebase
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

## Env Variables
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## No Incluye
- Historial
- Progreso
- Login/Autenticación
- Modo offline
- Perfil de usuario