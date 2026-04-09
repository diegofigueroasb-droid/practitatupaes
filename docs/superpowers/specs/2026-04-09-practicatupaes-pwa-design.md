# PracticaTuPAES - PWA Design Specification

**Fecha:** 2026-04-09  
**Versión:** 1.0  
**Status:** Draft

---

## 1. Concepto & Visión

**PracticaTuPAES** es una PWA de preparación para la PAES (Prueba de Acceso a la Educación Superior) de Chile. A diferencia de una app nativa, funciona en cualquier navegador y dispositivo sin instalación, con soporte offline parcial.

**Personalidad:** Moderna, educativa, confiable. Transmite profesionalismo y apoyo al estudiante en su preparación.

---

## 2. Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | Next.js 15 (App Router) + TypeScript |
| Estilos | Tailwind CSS + shadcn/ui |
| Backend | tRPC + Next.js API Routes |
| ORM | Prisma |
| Database | PostgreSQL (Neon) |
| Auth | Clerk |
| AI | Anthropic API (Claude) |
| Deployment | Vercel |
| PWA | next-pwa + Web Manifest |

---

## 3. Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js 15)               │
│  App Router → Server Components + Client Components    │
└──────────────────────┬────────────────────────────────┘
                       │ tRPC (end-to-end typesafe)
┌──────────────────────┼────────────────────────────────┐
│                Backend (Next.js API)                  │
│  tRPC Routers: sessions, questions, errors, progress  │
└──────────────────────┬────────────────────────────────┘
                       │
┌──────────────────────┼────────────────────────────────┐
│         Database (Neon PostgreSQL + Prisma)           │
│  Tables: User, Session, PendingError                   │
└────────────────────────────────────────────────────────┘
```

---

## 4. Estructura de Carpetas

```
practicatupaes/
├── prisma/
│   └── schema.prisma
├── public/
│   ├── icons/
│   └── manifest.json
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Rutas auth (Clerk)
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── (main)/            # Rutas protegidas
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx       # Home
│   │   │   ├── simulacion/
│   │   │   │   └── [sessionId]/  # Sesión activa
│   │   │   ├── historial/
│   │   │   ├── progreso/
│   │   │   └── perfil/
│   │   ├── api/
│   │   │   └── trpc/[trpc]/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                # shadcn/ui base
│   │   ├── simulation/        # QuestionCard, Alternatives
│   │   ├── charts/            # Progress charts
│   │   └── layout/            # Navbar, Footer
│   ├── lib/
│   │   ├── utils.ts
│   │   └── anthropic.ts
│   ├── server/
│   │   ├── api/
│   │   │   ├── routers/       # tRPC routers
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

type StudyMode = 'IA' | 'Ensayo oficial' | 'Repaso errores';

type AnswerOption = 'A' | 'B' | 'C' | 'D' | 'E';

interface QuestionItem {
  id: string;
  subject: Subject;
  prompt: string;
  alternatives: Array<{ key: AnswerOption; text: string }>;
  correctAlternative: AnswerOption;
  explanationsByAlternative: Record<AnswerOption, string>;
  modeSource: StudyMode;
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
| `getForMode` | `{subject, mode, count}` | `QuestionItem[]` | Carga preguntas según modo |
| `getOfficial` | `{subject, count}` | `QuestionItem[]` | Banco oficial |
| `getFromAI` | `{subject, count}` | `QuestionItem[]` | Genera con Anthropic |

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
   - IA: questions.getFromAI()
   - Oficial: questions.getOfficial()
   - Errores: errors.getPending()
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
7. Redirect → /historial (o /resultado inline)
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
--space-2: 1rem;     /* 16px */
--space-3: 1.5rem;   /* 24px */
--space-4: 2rem;     /* 32px */
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
  "description": "Prepárate para la PAES con preguntas de IA",
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

## 11. Autenticación (Clerk)

- Sign-in/Sign-up pages via Clerk hosted
- Middleware protege rutas `/historial`, `/progreso`, `/perfil`, `/simulacion`
- User sync: Clerk webhook → Prisma User upsert
- tRPC context incluye `userId` del Clerk token

---

## 12. Deploy (Vercel)

1. Conectar repo GitHub
2. Configurar environment variables:
   - `DATABASE_URL` (Neon PostgreSQL)
   - `CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `ANTHROPIC_API_KEY`
3. Deploy automático en push a main

---

## 13. TODOs

- [ ] Crear repo GitHub
- [ ] Inicializar T3 Stack
- [ ] Configurar Prisma schema
- [ ] Configurar Clerk
- [ ] Implementar routers tRPC
- [ ] Crear componentes UI base
- [ ] Implementar pantallas
- [ ] Configurar PWA
- [ ] Deploy to Vercel
