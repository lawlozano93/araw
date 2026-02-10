// Type definitions for Araw

export interface DailySession {
  id: string;
  date: string; // YYYY-MM-DD
  readGoals: boolean;
  readAffirmations: boolean;
  readVisualizations: boolean;
  promptsReviewed: boolean;
  streamDone: boolean;
  promptAnswered: boolean;
  selectedPromptId?: string;
}

export interface JournalEntry {
  id: string;
  date: string;
  streamText: string;
  promptText: string;
  answerText: string;
  actions: ActionItem[];
}

export interface ActionItem {
  id: string;
  text: string;
  done: boolean;
  isMain?: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface Prompt {
  id: string;
  text: string;
  tags: string[];
  isFavorite: boolean;
}

export interface FrontalPage {
  type: 'goals' | 'affirmations' | 'visualizations';
  content: string;
  lastModified: string;
}

export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;

export interface AppConfig {
  theme: 'light' | 'dark';
  currentStreak: number;
  lastSessionDate: string;
  sessions: Record<string, DailySession>;
  onboardingComplete: boolean;
}
