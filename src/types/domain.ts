'use strict';

export type AnswerOption = 'A' | 'B' | 'C' | 'D' | 'E';
export type Subject = 'Comprension Lectora' | 'Matematica M1' | 'Matematica M2' | 'Historia' | 'Ciencias' | 'Ciencias Biologia' | 'Ciencias Quimica' | 'Ciencias Fisica';
export type StudyMode = 'Ensayo oficial' | 'Repaso errores' | 'Official' | 'Practice';

export interface QuestionMetadata {
  admissionProcess?: string;
  curated?: boolean;
  examDate?: string;
  officialKey?: string;
  originalQuestionNumber?: number;
  sourceProvider?: string;
  sourceUrl?: string;
  excludedFromScore?: boolean;
  isPilot?: boolean;
  lectura?: number;
}

export interface QuestionItem {
  id: string;
  subject: Subject;
  prompt: string;
  alternatives: Array<{ key: AnswerOption; text: string }>;
  correctAlternative: AnswerOption;
  explanationsByAlternative?: Partial<Record<AnswerOption, string>>;
  modeSource?: StudyMode;
  difficulty?: 'easy' | 'medium' | 'hard';
  metadata?: QuestionMetadata;
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