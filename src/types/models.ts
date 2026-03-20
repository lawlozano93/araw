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
  /**
   * True when this entry contains an in-progress draft marker (autosave).
   * Used for UI hints and wizard resume.
   */
  inProgress?: boolean;
  /**
   * Draft stage encoded in the entry markdown marker.
   * 5 = stream step, 6 = answer step.
   */
  draftStep?: number;
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
  vaultPath?: string; // Custom data directory (default: ~/Documents/Araw)
}
