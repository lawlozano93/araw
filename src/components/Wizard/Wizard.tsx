import { useState, useEffect, useRef } from 'react';
import { type WizardStep, type DailySession, FOCUS_PROMPT } from '../../types/models';
import { loadPage, saveEntry, loadEntry, loadConfig, saveConfig, getToday } from '../../hooks/useStorage';
import { useSound } from '../../hooks/useSound';
import { ReadingStep } from './ReadingStep';
import { StreamStep } from './StreamStep';
import { AnswerStep } from './AnswerStep';
import { CompletionScreen } from './CompletionScreen';
import './Wizard.css';

interface WizardProps {
    session: DailySession;
    onUpdateSession: (updates: Partial<DailySession>) => void;
    onComplete: () => void;
    onBack: () => void;
}

export function Wizard({ session, onUpdateSession, onComplete, onBack }: WizardProps) {
    const playSound = useSound();
    const [step, setStep] = useState<WizardStep>(1);
    const [goalsContent, setGoalsContent] = useState('');
    const [affirmationsContent, setAffirmationsContent] = useState('');
    const [visualizationsContent, setVisualizationsContent] = useState('');
    const [streamText, setStreamText] = useState('');
    const [answerText, setAnswerText] = useState('');
    const [showCompletion, setShowCompletion] = useState(false);
    const draftSaveTimeoutRef = useRef<number | null>(null);
    const isDraftSavingRef = useRef(false);

    // Determine starting step based on session state
    useEffect(() => {
        if (session.promptAnswered) setStep(5);
        else if (session.streamDone) setStep(5);
        else if (session.promptsReviewed && !session.streamDone) setStep(4);
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

    // Load existing entry data (including drafts) if resuming.
    useEffect(() => {
        loadEntry(session.date).then(entry => {
            if (!entry) return;

            if (entry.streamText) setStreamText(entry.streamText);
            if (entry.answerText) setAnswerText(entry.answerText);

            if (!entry.answerText && entry.actions) {
                const main = entry.actions.find(a => a.isMain);
                if (main) setAnswerText(main.text);
            }

            if (entry.inProgress && !session.promptAnswered) {
                // Legacy: 5 = stream, 6 = answer. New: 4 = stream, 5 = answer.
                if (entry.draftStep === 6) setStep(5);
                else if (entry.draftStep === 5 && session.streamDone) setStep(5);
                else if (entry.draftStep === 4) setStep(4);
                else if (entry.draftStep === 5 && !session.streamDone) setStep(4);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session.date]);

    // Debounced autosave — stream (step 4)
    useEffect(() => {
        if (showCompletion) return;
        if (step !== 4) return;
        if (session.streamDone) return;

        if (draftSaveTimeoutRef.current) window.clearTimeout(draftSaveTimeoutRef.current);
        draftSaveTimeoutRef.current = window.setTimeout(async () => {
            isDraftSavingRef.current = true;
            try {
                await saveEntry({
                    id: session.date,
                    date: session.date,
                    streamText,
                    promptText: FOCUS_PROMPT.text,
                    answerText,
                    actions: [],
                    inProgress: true,
                    draftStep: 4,
                });
            } finally {
                isDraftSavingRef.current = false;
            }
        }, 600);

        return () => {
            if (draftSaveTimeoutRef.current) window.clearTimeout(draftSaveTimeoutRef.current);
        };
    }, [step, session.date, session.streamDone, streamText, answerText, showCompletion]);

    // Debounced autosave — answer (step 5)
    useEffect(() => {
        if (showCompletion) return;
        if (step !== 5) return;
        if (session.promptAnswered) return;

        if (draftSaveTimeoutRef.current) window.clearTimeout(draftSaveTimeoutRef.current);
        draftSaveTimeoutRef.current = window.setTimeout(async () => {
            isDraftSavingRef.current = true;
            try {
                await saveEntry({
                    id: session.date,
                    date: session.date,
                    streamText,
                    promptText: FOCUS_PROMPT.text,
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
    }, [step, session.date, session.promptAnswered, streamText, answerText, showCompletion]);

    const handleNext = async () => {
        playSound();
        if (step === 1) {
            onUpdateSession({ readGoals: true });
            setStep(2);
        } else if (step === 2) {
            onUpdateSession({ readAffirmations: true });
            setStep(3);
        } else if (step === 3) {
            await saveEntry({
                id: session.date,
                date: session.date,
                streamText,
                promptText: FOCUS_PROMPT.text,
                answerText,
                actions: [],
                inProgress: true,
                draftStep: 4,
            });
            onUpdateSession({
                readVisualizations: true,
                promptsReviewed: true,
                selectedPromptId: FOCUS_PROMPT.id,
            });
            setStep(4);
        } else if (step === 4) {
            await saveEntry({
                id: session.date,
                date: session.date,
                streamText,
                promptText: FOCUS_PROMPT.text,
                answerText,
                actions: [],
                inProgress: true,
                draftStep: 5,
            });
            onUpdateSession({ streamDone: true });
            setStep(5);
        } else if (step === 5) {
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
                promptText: FOCUS_PROMPT.text,
                answerText,
                actions: [mainActionItem],
            });

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
                    nextStreak = nextStreak;
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

    const stepTitles = ['Goals', 'Affirmations', 'Visualizations', 'Write', 'Answer'];

    const getIndicatorIndex = (s: WizardStep) => s - 1;

    return (
        <div className="wizard">
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
                    <StreamStep
                        value={streamText}
                        onChange={setStreamText}
                        onDone={handleNext}
                    />
                )}
                {step === 5 && (
                    <AnswerStep
                        mainAnswer={answerText}
                        onMainAnswerChange={setAnswerText}
                        onDone={handleNext}
                    />
                )}
            </div>

            <button type="button" className="wizard-back" onClick={() => { playSound(); onBack(); }}>
                ← Back
            </button>
            {showCompletion && <CompletionScreen onFinish={onComplete} />}
        </div>
    );
}
