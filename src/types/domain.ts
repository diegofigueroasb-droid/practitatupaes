'use strict';

export type AnswerOption = 'A' | 'B' | 'C' | 'D' | 'E';
export type Subject = 'Comprension Lectora' | 'Matematica M1' | 'Matematica M2' | 'Historia' | 'Ciencias';
export type StudyMode = 'Ensayo oficial' | 'Repaso errores';

export interface QuestionItem {
  id: string;
  subject: Subject;
  prompt: string;
  alternatives: Array<{ key: AnswerOption; text: string }>;
  correctAlternative: AnswerOption;
  explanationsByAlternative: Record<AnswerOption, string>;
  modeSource?: StudyMode;
}

export interface SessionRecord {
  id: string;
  userId: string;
  subject: Subject;
  mode: StudyMode;
  questionCount: number;
  correctCount: number;
  incorrectCount: number;
  estimatedScore: number;
  answers: Array<{ questionId: string; selectedAlternative: AnswerOption; isCorrect: boolean }>;
  questions: QuestionItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PendingError {
  id: string;
  userId: string;
  questionHash: string;
  question: QuestionItem;
  selectedAlternative: AnswerOption;
  correctAlternative: AnswerOption;
  reviewCount: number;
  resolved: boolean;
  lastSeenAt: Date;
  createdAt: Date;
}