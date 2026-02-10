import { useState, useEffect, useCallback } from 'react';
import type { DailySession, ActionItem } from '../types/models';
import { loadConfig, saveConfig, loadEntry, saveEntry, getToday } from './useStorage';

// dateOverride is for testing purposes only - allows creating entries on different dates
export function useSession(dateOverride?: string) {
    const [session, setSession] = useState<DailySession | null>(null);
    const [loading, setLoading] = useState(true);
    const [onboardingComplete, setOnboardingComplete] = useState(true); // Default true to avoid flash, will update
    const today = dateOverride || getToday();

    useEffect(() => {
        const init = async () => {
            try {
                const config = await loadConfig();
                setOnboardingComplete(!!config.onboardingComplete);

                const sessions = (config as any).sessions || {};
                const todaySession = sessions[today];

                if (todaySession) {
                    setSession(todaySession);
                } else {
                    const newSession: DailySession = {
                        id: crypto.randomUUID(),
                        date: today,
                        readGoals: false,
                        readAffirmations: false,
                        readVisualizations: false,
                        promptsReviewed: false,
                        streamDone: false,
                        promptAnswered: false,
                    };
                    setSession(newSession);

                    // Save to config
                    sessions[today] = newSession;
                    await saveConfig({ ...config, sessions });
                }
            } catch (e) {
                // Fallback to localStorage if Tauri isn't ready
                setOnboardingComplete(localStorage.getItem('onboardingComplete') === 'true');
                const stored = localStorage.getItem(`session-${today}`);
                if (stored) {
                    setSession(JSON.parse(stored));
                } else {
                    const newSession: DailySession = {
                        id: crypto.randomUUID(),
                        date: today,
                        readGoals: false,
                        readAffirmations: false,
                        readVisualizations: false,
                        promptsReviewed: false,
                        streamDone: false,
                        promptAnswered: false,
                    };
                    setSession(newSession);
                    localStorage.setItem(`session-${today}`, JSON.stringify(newSession));
                }
            }
            setLoading(false);
        };

        init();
        window.addEventListener('focus', init);
        return () => window.removeEventListener('focus', init);
    }, [today]);

    const updateSession = useCallback(async (updates: Partial<DailySession>) => {
        if (!session) return;
        const updated = { ...session, ...updates };
        setSession(updated);

        try {
            const config = await loadConfig();
            const sessions = (config as any).sessions || {};
            sessions[updated.date] = updated;
            await saveConfig({ ...config, sessions });
        } catch {
            localStorage.setItem(`session-${session.date}`, JSON.stringify(updated));
        }
    }, [session]);

    const completeOnboarding = useCallback(async () => {
        setOnboardingComplete(true);
        // Persistence handled by Onboarding component usually, but we can do it here too if needed
        // Assuming Onboarding component calls saveConfig
    }, []);

    const completedSteps = session ? [
        session.readGoals,
        session.readAffirmations,
        session.readVisualizations,
        session.promptsReviewed,
        session.streamDone,
        session.promptAnswered,
    ].filter(Boolean).length : 0;

    const currentStep = completedSteps + 1;
    const isComplete = completedSteps === 6;

    return { session, loading, updateSession, completedSteps, currentStep, isComplete, onboardingComplete, completeOnboarding };
}

export function useTheme() {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        const stored = localStorage.getItem('theme');
        return (stored as 'light' | 'dark') || 'light';
    });

    useEffect(() => {
        // Apply theme to document
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);

    useEffect(() => {
        // Listen for storage events (changes from other windows)
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'theme' && e.newValue) {
                setTheme(e.newValue as 'light' | 'dark');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const toggleTheme = () => setTheme(t => t === 'light' ? 'dark' : 'light');

    return { theme, toggleTheme };
}

export function useActions(dateOverride?: string) {
    const [actions, setActions] = useState<ActionItem[]>([]);
    const today = dateOverride || getToday();

    const load = useCallback(async () => {
        try {
            const entry = await loadEntry(today);
            if (entry) {
                setActions(entry.actions || []);
            } else {
                setActions([]);
            }
        } catch {
            const stored = localStorage.getItem(`actions-${today}`);
            if (stored) {
                setActions(JSON.parse(stored));
            }
        }
    }, [today]);

    useEffect(() => {
        load();
        window.addEventListener('focus', load);
        return () => window.removeEventListener('focus', load);
    }, [load]);

    const saveActions = async (newActions: ActionItem[]) => {
        setActions(newActions);

        try {
            const entry = await loadEntry(today);
            if (entry) {
                await saveEntry({ ...entry, actions: newActions });
            }
        } catch {
            localStorage.setItem(`actions-${today}`, JSON.stringify(newActions));
        }
    };

    const addAction = (text: string) => {
        const newAction: ActionItem = {
            id: crypto.randomUUID(),
            text,
            done: false,
            createdAt: new Date().toISOString(),
        };
        saveActions([...actions, newAction]);
    };

    const toggleAction = (id: string) => {
        saveActions(actions.map(a =>
            a.id === id
                ? { ...a, done: !a.done, completedAt: !a.done ? new Date().toISOString() : undefined }
                : a
        ));
    };

    const deleteAction = (id: string) => {
        saveActions(actions.filter(a => a.id !== id));
    };

    const pendingCount = actions.filter(a => !a.done).length;
    const completedCount = actions.filter(a => a.done).length;

    return { actions, addAction, toggleAction, deleteAction, pendingCount, completedCount, refresh: load };
}
