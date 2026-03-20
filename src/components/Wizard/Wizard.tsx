import { useState, useEffect } from 'react';
import type { WizardStep, DailySession, Prompt } from '../../types/models';
import { loadPage, saveEntry, loadEntry, loadPrompts, loadConfig, saveConfig, getToday } from '../../hooks/useStorage';
import { useSound } from '../../hooks/useSound';
import { ReadingStep } from './ReadingStep';
import { StreamStep } from './StreamStep';
import { AnswerStep } from './AnswerStep';
import { PromptStep } from './PromptStep';
import { CompletionScreen } from './CompletionScreen';
import './Wizard.css';
import { useRef } from 'react';

interface WizardProps {
    session: DailySession;
    onUpdateSession: (updates: Partial<DailySession>) => void;
    onComplete: () => void;
    onBack: () => void;
}

const FOCUS_PROMPT: Prompt = {
    id: 'focus-daily',
    text: 'What is the ONE most important thing I must do today to move closer to what I want?',
    tags: ['focus'],
    isFavorite: true
};

export function Wizard({ session, onUpdateSession, onComplete, onBack }: WizardProps) {
    const playSound = useSound();
    const [step, setStep] = useState<WizardStep>(1);
    const [goalsContent, setGoalsContent] = useState('');
    const [affirmationsContent, setAffirmationsContent] = useState('');
    const [visualizationsContent, setVisualizationsContent] = useState('');
    const [prompts, setPrompts] = useState<Prompt[]>([FOCUS_PROMPT]);
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt>(FOCUS_PROMPT);
    const [streamText, setStreamText] = useState('');
    const [answerText, setAnswerText] = useState('');
    const [showCompletion, setShowCompletion] = useState(false);
    const draftSaveTimeoutRef = useRef<number | null>(null);
    const isDraftSavingRef = useRef(false);

    // Determine starting step based on session state
    useEffect(() => {
        if (session.promptAnswered) setStep(6);
        else if (session.streamDone) setStep(6);
        else if (session.promptsReviewed) setStep(5);
        else if (session.readVisualizations) setStep(4);
        else if (session.readAffirmations) setStep(3);
        else if (session.readGoals) setStep(2);
        else setStep(1);
    }, []);

    // Load content with fallbacks
    useEffect(() => {
        loadPage('goals').then(setGoalsContent).catch(() => setGoalsContent('# My Goals\n\n- Build meaningful products\n- Develop consistent habits'));
        loadPage('affirmations').then(setAffirmationsContent).catch(() => setAffirmationsContent('# Affirmations\n\n- I am capable of achieving my goals'));
        loadPage('visualizations').then(setVisualizationsContent).catch(() => setVisualizationsContent('# Visualizations\n\nImagine yourself one year from now...'));
    }, []);

    // Load prompts once (source of truth for Step 4).
    useEffect(() => {
        loadPrompts()
            .then(setPrompts)
            .catch(() => setPrompts([FOCUS_PROMPT]));
    }, []);

    // Restore prompt selection from session (if present).
    useEffect(() => {
        if (!session.selectedPromptId) return;
        const match = prompts.find(p => p.id === session.selectedPromptId);
        if (match) setSelectedPrompt(match);
    }, [session.selectedPromptId, prompts]);

    // Load existing entry data (including drafts) if resuming.
    useEffect(() => {
        loadEntry(session.date).then(entry => {
            if (!entry) return;

            if (entry.streamText) setStreamText(entry.streamText);
            if (entry.answerText) setAnswerText(entry.answerText);

            // Also try to find main action text if answerText is empty but action exists.
            if (!entry.answerText && entry.actions) {
                const main = entry.actions.find(a => a.isMain);
                if (main) setAnswerText(main.text);
            }

            // If we find an autosaved draft, override step so the wizard can resume.
            if (entry.inProgress) {
                if (entry.draftStep === 6 && !session.promptAnswered) setStep(6);
                if (entry.draftStep === 5 && !session.streamDone && !session.promptAnswered) setStep(5);

                // For draft step 5/6, restore the prompt text even if session flags didn't persist.
                if (entry.promptText && entry.draftStep && entry.draftStep >= 5) {
                    setSelectedPrompt({
                        id: session.selectedPromptId || 'draft-prompt',
                        text: entry.promptText,
                        tags: [],
                        isFavorite: false,
                    });
                }
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session.date]);

    // Debounced autosave for Step 5 (stream).
    useEffect(() => {
        if (showCompletion) return;
        if (step !== 5) return;
        if (session.streamDone) return;

        if (draftSaveTimeoutRef.current) window.clearTimeout(draftSaveTimeoutRef.current);
        draftSaveTimeoutRef.current = window.setTimeout(async () => {
            isDraftSavingRef.current = true;
            try {
                await saveEntry({
                    id: session.date,
                    date: session.date,
                    streamText,
                    promptText: selectedPrompt.text,
                    answerText,
                    actions: [],
                    inProgress: true,
                    draftStep: 5,
                });
            } finally {
                isDraftSavingRef.current = false;
            }
        }, 600);

        return () => {
            if (draftSaveTimeoutRef.current) window.clearTimeout(draftSaveTimeoutRef.current);
        };
    }, [step, session.date, session.streamDone, streamText, answerText, selectedPrompt.text, showCompletion]);

    // Debounced autosave for Step 6 (answer).
    useEffect(() => {
        if (showCompletion) return;
        if (step !== 6) return;
        if (session.promptAnswered) return;

        if (draftSaveTimeoutRef.current) window.clearTimeout(draftSaveTimeoutRef.current);
        draftSaveTimeoutRef.current = window.setTimeout(async () => {
            isDraftSavingRef.current = true;
            try {
                await saveEntry({
                    id: session.date,
                    date: session.date,
                    streamText,
                    promptText: selectedPrompt.text,
                    answerText,
                    actions: [],
                    inProgress: true,
                    draftStep: 6,
                });
            } finally {
                isDraftSavingRef.current = false;
            }
        }, 600);

        return () => {
            if (draftSaveTimeoutRef.current) window.clearTimeout(draftSaveTimeoutRef.current);
        };
    }, [step, session.date, session.promptAnswered, streamText, answerText, selectedPrompt.text, showCompletion]);

    const handleNext = async () => {
        playSound();
        if (step === 1) {
            onUpdateSession({ readGoals: true });
            setStep(2);
        } else if (step === 2) {
            onUpdateSession({ readAffirmations: true });
            setStep(3);
        } else if (step === 3) {
            onUpdateSession({
                readVisualizations: true,
            });
            setStep(4);
        } else if (step === 4) {
            if (!selectedPrompt?.id) return;
            await saveEntry({
                id: session.date,
                date: session.date,
                streamText,
                promptText: selectedPrompt.text,
                answerText,
                actions: [],
                inProgress: true,
                draftStep: 5,
            });
            onUpdateSession({
                promptsReviewed: true,
                selectedPromptId: selectedPrompt.id,
            });
            setStep(5);
        } else if (step === 5) {
            // Ensure the prompt+stream draft marker is aligned with step 6 before switching.
            await saveEntry({
                id: session.date,
                date: session.date,
                streamText,
                promptText: selectedPrompt.text,
                answerText,
                actions: [],
                inProgress: true,
                draftStep: 6,
            });
            onUpdateSession({ streamDone: true });
            setStep(6);
        } else if (step === 6) {
            // Save entry and complete

            // Create main action
            const mainActionItem = {
                id: crypto.randomUUID(),
                text: answerText,
                done: false,
                isMain: true,
                createdAt: new Date().toISOString()
            };

            await saveEntry({
                id: session.date,
                date: session.date,
                streamText,
                promptText: selectedPrompt.text,
                answerText, // Keeping this for record
                actions: [mainActionItem],
            });

            // Update streak once per completed day.
            try {
                const today = getToday();
                const config = await loadConfig();

                const parseDateUtc = (d: string) => {
                    const [y, m, day] = d.split('-').map(Number);
                    return Date.UTC(y, (m || 1) - 1, day || 1);
                };

                const last = config.lastSessionDate;
                const lastMs = last ? parseDateUtc(last) : null;
                const todayMs = parseDateUtc(today);

                let nextStreak = config.currentStreak || 0;

                if (!last) {
                    nextStreak = 1;
                } else if (last === today) {
                    nextStreak = nextStreak; // No change
                } else {
                    const diffDays = Math.round((todayMs - (lastMs as number)) / 86400000);
                    if (diffDays === 1) nextStreak = nextStreak + 1;
                    else nextStreak = 1;
                }

                await saveConfig({
                    ...config,
                    currentStreak: nextStreak,
                    lastSessionDate: today,
                });
            } catch {
                // Streak is a best-effort enhancement.
            }

            onUpdateSession({ promptAnswered: true });
            setShowCompletion(true);
        }
    };

    // Removed 'Focus' from titles
    const stepTitles = ['Goals', 'Affirmations', 'Visualizations', 'Prompt', 'Write', 'Answer'];

    const getIndicatorIndex = (s: WizardStep) => {
        return s - 1;
    };

    return (
        <div className="wizard">
            {/* Step indicator - minimal */}
            <div className="wizard-progress">
                {stepTitles.map((title, i) => {
                    const currentIndex = getIndicatorIndex(step);
                    return (
                        <span
                            key={i}
                            className={`wizard-step-dot ${i <= currentIndex ? 'active' : ''} ${i === currentIndex ? 'current' : ''}`}
                            title={title}
                        />
                    );
                })}
            </div>

            {/* Content */}
            <div className="wizard-content">
                {step === 1 && (
                    <ReadingStep
                        title="Goals"
                        content={goalsContent}
                        onDone={handleNext}
                    />
                )}
                {step === 2 && (
                    <ReadingStep
                        title="Affirmations"
                        content={affirmationsContent}
                        onDone={handleNext}
                    />
                )}
                {step === 3 && (
                    <ReadingStep
                        title="Visualizations"
                        content={visualizationsContent}
                        onDone={handleNext}
                    />
                )}
                {step === 4 && (
                    <PromptStep
                        prompts={prompts}
                        selectedPromptId={selectedPrompt.id}
                        onSelectPrompt={(p) => {
                            setSelectedPrompt(p);
                            onUpdateSession({ selectedPromptId: p.id });
                        }}
                        onDone={handleNext}
                    />
                )}
                {step === 5 && (
                    <StreamStep
                        value={streamText}
                        onChange={setStreamText}
                        onDone={handleNext}
                    />
                )}
                {step === 6 && (
                    <AnswerStep
                        prompt={selectedPrompt}
                        mainAnswer={answerText}
                        onMainAnswerChange={setAnswerText}
                        onDone={handleNext}
                    />
                )}
            </div>

            {/* Back button */}
            <button className="wizard-back" onClick={() => { playSound(); onBack(); }}>
                ← Back
            </button>
            {showCompletion && <CompletionScreen onFinish={onComplete} />}
        </div>
    );
}
