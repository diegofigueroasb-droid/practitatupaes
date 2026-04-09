# PracticaTuPAES - PWA Design Specification

**Fecha:** 2026-04-09  
**Versión:** 1.1  
**Status:** Draft

---

## 1. Concepto & Visión

**PracticaTuPAES** es una PWA de preparación para la PAES (Prueba de Acceso a la Educación Superior) de Chile. A diferencia de una app nativa, funciona en cualquier navegador y dispositivo sin instalación.

**Personalidad:** Moderna, educativa, confiable. Transmite profesionalismo y apoyo al estudiante en su preparación.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Estilos | Tailwind CSS + shadcn/ui |
| Backend | tRPC + Next.js API Routes |
| ORM | Prisma |
| Database | PostgreSQL (Supabase) |
| Auth | Clerk |
| Deployment | Vercel |
| PWA | next-pwa + Web Manifest |

---

## 3. Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)               │
│  App Router → Server Components + Client Components     │
└──────────────────────┬────────────────────────────────┘
                       │ tRPC (end-to-end typesafe)
┌──────────────────────┼────────────────────────────────┐
│                Backend (Next.js API)                   │
│  tRPC Routers: sessions, questions, errors, progress    │
└──────────────────────┬────────────────────────────────┘
                       │
┌──────────────────────┼────────────────────────────────┐
│           Database (Supabase PostgreSQL + Prisma)      │
│  Tables: User, Session, PendingError, Question         │
└────────────────────────────────────────────────────────┘
```

---

## 4. Estructura de Carpetas

```
practicatupaes/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts              # Seed preguntas banco oficial
├── public/
│   ├── icons/
│   └── manifest.json
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── (main)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx       # Home
│   │   │   ├── simulacion/
│   │   │   │   └── [sessionId]/
│   │   │   ├── historial/
│   │   │   ├── progreso/
│   │   │   └── perfil/
│   │   ├── api/
│   │   │   └── trpc/[trpc]/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── simulation/
│   │   ├── charts/
│   │   └── layout/
│   ├── lib/
│   │   └── utils.ts
│   ├── server/
│   │   ├── api/
│   │   │   ├── routers/
│   │   │   └── trpc.ts
│   │   └── db.ts
│   └── styles/
│       └── globals.css
└── tailwind.config.ts
```

---

## 5. Schema de Base de Datos

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  sessions      Session[]
  errors        PendingError[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Session {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id])
  subject         String
  mode            String
  questionCount   Int
  correctCount    Int
  incorrectCount  Int
  estimatedScore  Int       // 150-850
  answers         Json
  questions       Json
  createdAt       DateTime  @default(now())
}

model PendingError {
  id                  String    @id @default(cuid())
  userId              String
  user                User      @relation(fields: [userId], references: [id])
  questionId          String
  question            Json
  selectedAlternative String
  correctAlternative  String
  reviewCount         Int       @default(1)
  resolved            Boolean   @default(false)
  lastSeenAt          DateTime  @default(now())
  createdAt           DateTime  @default(now())

  @@unique([userId, questionId])
}

model Question {
  id                       String   @id @default(cuid())
  subject                  String
  prompt                   String
  alternatives             Json     // [{key: "A", text: "..."}]
  correctAlternative       String
  explanationsByAlternative Json   // {A: "...", B: "...", ...}
  createdAt                DateTime @default(now())

  @@index([subject])
}
```

---

## 6. Tipos de Dominio

```typescript
type Subject = 
  | 'Comprension Lectora' 
  | 'Matematica M1' 
  | 'Matematica M2' 
  | 'Historia' 
  | 'Ciencias';

type StudyMode = 'Ensayo oficial' | 'Repaso errores';

type AnswerOption = 'A' | 'B' | 'C' | 'D' | 'E';

interface QuestionItem {
  id: string;
  subject: Subject;
  prompt: string;
  alternatives: Array<{ key: AnswerOption; text: string }>;
  correctAlternative: AnswerOption;
  explanationsByAlternative: Record<AnswerOption, string>;
}

interface SessionAnswer {
  questionId: string;
  selectedAlternative: AnswerOption;
  isCorrect: boolean;
}

interface SessionRecord {
  id: string;
  userId: string;
  subject: Subject;
  mode: StudyMode;
  questionCount: number;
  correctCount: number;
  incorrectCount: number;
  estimatedScore: number;
  answers: SessionAnswer[];
  questions: QuestionItem[];
  createdAt: string;
}
```

---

## 7. API Design (tRPC Routers)

### sessions router

| Procedure | Input | Output | Descripción |
|-----------|-------|--------|-------------|
| `create` | `{subject, mode, questionCount}` | `SessionRecord` | Crea sesión y carga preguntas |
| `getById` | `{id}` | `SessionRecord` | Obtiene sesión por ID |
| `getRecent` | `{limit?}` | `SessionRecord[]` | Últimas sesiones del usuario |
| `complete` | `{id, answers}` | `SessionRecord` | Finaliza sesión, calcula score |

### questions router

| Procedure | Input | Output | Descripción |
|-----------|-------|--------|-------------|
| `getRandom` | `{subject, count}` | `QuestionItem[]` | Preguntas aleatorias del banco |
| `getBySubject` | `{subject}` | `QuestionItem[]` | Todas las preguntas de una materia |

### errors router

| Procedure | Input | Output | Descripción |
|-----------|-------|--------|-------------|
| `getPending` | `{subject?}` | `PendingError[]` | Errores pendientes |
| `resolve` | `{questionId}` | `PendingError` | Marca como resuelto |

### progress router

| Procedure | Input | Output | Descripción |
|-----------|-------|--------|-------------|
| `getStats` | `{}` | `ProgressStats` | Stats agregados |
| `getTrend` | `{subject, limit}` | `ScoreTrend[]` | Tendencia últimos N ensayos |

---

## 8. Flujo de Simulación

```
1. User → Home (selecciona materia/modo/cantidad)
        ↓
2. tRPC: sessions.create()
   - Oficial: questions.getRandom(subject, count)
   - Errores: errors.getPending(subject, count)
        ↓
3. Render: /simulacion/[sessionId]
   - Client state: currentIndex, selectedAnswer, phase
        ↓
4. User responde → selectAnswer()
   - Fase: active → feedback
   - Muestra: verde/rojo + explicación
        ↓
5. User → Siguiente
   - advance() → siguiente pregunta o done
        ↓
6. Session completa → sessions.complete()
   - Calcula score
   - Upsert PendingErrors
        ↓
7. Redirect → /historial
```

---

## 9. Sistema de Diseño

### Colores

```css
:root {
  --color-primary: #0F766E;        /* Teal oscuro */
  --color-primary-light: #14B8A6;  /* Teal claro */
  --color-accent: #F59E0B;         /* Amber */
  --color-bg: #FAFAFA;
  --color-surface: #FFFFFF;
  --color-surface-alt: #F3F4F6;
  --color-text: #111827;
  --color-text-muted: #6B7280;
  --color-success: #10B981;
  --color-error: #EF4444;
  --color-border: #E5E7EB;
}
```

### Espaciado (8px scale)

```css
--space-1: 0.5rem;   /* 8px */
--space-2: 1rem;      /* 16px */
--space-3: 1.5rem;    /* 24px */
--space-4: 2rem;      /* 32px */
```

### Componentes UI

| Componente | Descripción |
|------------|-------------|
| `QuestionCard` | Tarjeta con pregunta y alternativas |
| `AlternativeButton` | Botón A-E con estados: idle/selected/correct/wrong/dimmed |
| `FeedbackBanner` | Banner correcto/incorrecto |
| `ProgressBar` | Barra de progreso sesión |
| `ScoreCard` | Tarjeta puntaje 150-850 |
| `SubjectChart` | Gráfico radar/barras por materia |
| `SessionList` | Lista de sesiones en historial |

---

## 10. PWA Configuration

```json
{
  "name": "PracticaTuPAES",
  "short_name": "PracticaPAES",
  "description": "Prepárate para la PAES con preguntas oficiales DEMRE",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FAFAFA",
  "theme_color": "#0F766E",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 11. Banco de Preguntas

Preguntas del banco local migradas del proyecto original:

| Materia | Archivo Fuente | Descripción |
|---------|----------------|-------------|
| Comprensión Lectora | `competencia-lectora.ts` | 65 preguntas |
| Matemática M1 | `matematica-m1.ts` | Problemas cotidianos, álgebra |
| Matemática M2 | `matematica-m2.ts` | Funciones, trigonometría, logaritmos |
| Historia | `historia.ts` | Procesos históricos Chile/Mundo |
| Ciencias | `ciencias.ts` | Física, Química, Biología |

Seed script: `prisma/seed.ts` importa preguntas a tabla `Question`.

---

## 12. Autenticación (Clerk)

- Sign-in/Sign-up pages via Clerk hosted
- Middleware protege rutas `/historial`, `/progreso`, `/perfil`, `/simulacion`
- User sync: Clerk webhook → Prisma User upsert
- tRPC context incluye `userId` del Clerk token

---

## 13. Deploy (Vercel)

1. Conectar repo GitHub
2. Configurar environment variables:
   - `DATABASE_URL` (Supabase PostgreSQL connection string)
   - `CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
3. Deploy automático en push a main
4. Post-deploy: `prisma db seed` para populate preguntas

---

## 14. TODOs

- [ ] Crear repo GitHub
- [ ] Inicializar T3 Stack
- [ ] Migrar preguntas del banco local (seed)
- [ ] Configurar Prisma schema
- [ ] Configurar Clerk
- [ ] Implementar routers tRPC
- [ ] Crear componentes UI base
- [ ] Implementar pantallas
- [ ] Configurar PWA
- [ ] Deploy to Vercel
