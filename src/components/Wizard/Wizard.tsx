import { useState, useEffect } from 'react';
import type { WizardStep, DailySession, Prompt } from '../../types/models';
import { loadPage, saveEntry, loadEntry } from '../../hooks/useStorage';
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
    // prompts state removed
    const [selectedPrompt] = useState<Prompt>(FOCUS_PROMPT);
    const [streamText, setStreamText] = useState('');
    const [answerText, setAnswerText] = useState('');
    const [showCompletion, setShowCompletion] = useState(false);

    // Determine starting step based on session state
    useEffect(() => {
        if (session.promptAnswered) setStep(6);
        else if (session.streamDone) setStep(6);
        // Step 4 skipped
        else if (session.readVisualizations) setStep(5);
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

    // Load existing entry data if resuming
    useEffect(() => {
        if (session.streamDone || session.promptAnswered) {
            loadEntry(session.date).then(entry => {
                if (entry) {
                    if (entry.streamText) setStreamText(entry.streamText);
                    if (entry.answerText) setAnswerText(entry.answerText);
                    // Also try to find main action text if answerText is empty but action exists
                    if (!entry.answerText && entry.actions) {
                        const main = entry.actions.find(a => a.isMain);
                        if (main) setAnswerText(main.text);
                    }
                }
            });
        }
    }, [session.date, session.streamDone, session.promptAnswered]);

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
                // Skip step 4 (Focus), go straight to Stream (Step 5)
                // Implicitly mark prompts as reviewed
                promptsReviewed: true,
                selectedPromptId: FOCUS_PROMPT.id
            });
            setStep(5);
        } else if (step === 5) {
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
            onUpdateSession({ promptAnswered: true });
            setShowCompletion(true);
        }
    };

    // Removed 'Focus' from titles
    const stepTitles = ['Goals', 'Affirmations', 'Visualizations', 'Write', 'Answer'];

    // Helper to map current step to indicator index
    // 1->0, 2->1, 3->2, 5->3, 6->4
    const getIndicatorIndex = (s: WizardStep) => {
        if (s <= 3) return s - 1;
        if (s === 5) return 3;
        if (s === 6) return 4;
        return 0;
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
                {/* Step 4 Removed */}
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
