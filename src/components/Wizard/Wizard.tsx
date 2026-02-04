import { useState, useEffect } from 'react';
import type { WizardStep, DailySession, Prompt } from '../../types/models';
import { loadPage, loadPrompts, saveEntry } from '../../hooks/useStorage';
import { ReadingStep } from './ReadingStep';
import { PromptsStep } from './PromptsStep';
import { StreamStep } from './StreamStep';
import { AnswerStep } from './AnswerStep';
import './Wizard.css';

interface WizardProps {
    session: DailySession;
    onUpdateSession: (updates: Partial<DailySession>) => void;
    onComplete: () => void;
    onBack: () => void;
}

export function Wizard({ session, onUpdateSession, onComplete, onBack }: WizardProps) {
    const [step, setStep] = useState<WizardStep>(1);
    const [goalsContent, setGoalsContent] = useState('');
    const [affirmationsContent, setAffirmationsContent] = useState('');
    const [visualizationsContent, setVisualizationsContent] = useState('');
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
    const [streamText, setStreamText] = useState('');
    const [answerText, setAnswerText] = useState('');
    const [actions, setActions] = useState<string[]>([]);

    // Default prompts fallback
    const DEFAULT_PROMPTS: Prompt[] = [
        { id: '1', text: 'What is the single most important thing I need to accomplish today?', tags: ['focus'], isFavorite: true },
        { id: '2', text: 'What am I grateful for right now?', tags: ['gratitude'], isFavorite: false },
        { id: '3', text: 'What would make today great?', tags: ['intention'], isFavorite: false },
        { id: '4', text: 'What is one thing I can do today to move closer to my goals?', tags: ['goals'], isFavorite: true },
        { id: '5', text: 'What lesson did I learn yesterday that I can apply today?', tags: ['reflection'], isFavorite: false },
    ];

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
        loadPrompts().then(p => {
            const loaded = p.length > 0 ? p : DEFAULT_PROMPTS;
            setPrompts(loaded);
        }).catch(() => setPrompts(DEFAULT_PROMPTS));
    }, []);

    const handleNext = () => {
        if (step === 1) {
            onUpdateSession({ readGoals: true });
            setStep(2);
        } else if (step === 2) {
            onUpdateSession({ readAffirmations: true });
            setStep(3);
        } else if (step === 3) {
            onUpdateSession({ readVisualizations: true });
            setStep(4);
        } else if (step === 4) {
            onUpdateSession({ promptsReviewed: true, selectedPromptId: selectedPrompt?.id });
            setStep(5);
        } else if (step === 5) {
            onUpdateSession({ streamDone: true });
            setStep(6);
        } else if (step === 6) {
            // Save entry and complete
            saveEntry({
                id: session.date,
                date: session.date,
                streamText,
                promptText: selectedPrompt?.text || '',
                answerText,
                actions: actions.map(text => ({
                    id: crypto.randomUUID(),
                    text,
                    done: false,
                    createdAt: new Date().toISOString(),
                })),
            });
            onUpdateSession({ promptAnswered: true });
            onComplete();
        }
    };

    const stepTitles = ['Goals', 'Affirmations', 'Visualizations', 'Prompts', 'Write', 'Answer'];

    return (
        <div className="wizard">
            {/* Step indicator - minimal */}
            <div className="wizard-progress">
                {stepTitles.map((title, i) => (
                    <span
                        key={i}
                        className={`wizard-step-dot ${i + 1 <= step ? 'active' : ''} ${i + 1 === step ? 'current' : ''}`}
                    />
                ))}
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
                    <PromptsStep
                        prompts={prompts}
                        selectedPrompt={selectedPrompt}
                        onSelect={setSelectedPrompt}
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
                        actions={actions}
                        onAddAction={(text) => setActions([...actions, text])}
                        onRemoveAction={(i) => setActions(actions.filter((_, idx) => idx !== i))}
                        onDone={handleNext}
                    />
                )}
            </div>

            {/* Back button */}
            <button className="wizard-back" onClick={onBack}>
                ← Back
            </button>
        </div>
    );
}
