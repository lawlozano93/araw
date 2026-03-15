import { useState } from 'react';
import { savePage, loadConfig, saveConfig } from '../../hooks/useStorage';
import { SmartTextarea } from '../SmartTextarea';
import { useSound } from '../../hooks/useSound';
import './Onboarding.css';

interface OnboardingProps {
    onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
    const playSound = useSound();
    const [step, setStep] = useState(0);
    const [goals, setGoals] = useState('');
    const [affirmations, setAffirmations] = useState('');
    const [visualizations, setVisualizations] = useState('');
    const [goalsTooltip, setGoalsTooltip] = useState(false);
    const [affTooltip, setAffTooltip] = useState(false);
    const [vizTooltip, setVizTooltip] = useState(false);

    const TOTAL_STEPS = 5;

    const handleNext = async () => {
        playSound();
        if (step < TOTAL_STEPS - 1) {
            setStep(step + 1);
        } else {
            // Final step — save everything and complete
            await savePage('goals', goals);
            await savePage('affirmations', affirmations);
            await savePage('visualizations', visualizations);
            const config = await loadConfig();
            await saveConfig({ ...config, onboardingComplete: true });
            onComplete();
        }
    };

    const handleBack = () => {
        playSound();
        if (step > 0) setStep(step - 1);
    };

    const ctaLabel = () => {
        switch (step) {
            case 0: return 'Set Up My Ritual';
            case 1: return 'Next: Affirmations';
            case 2: return 'Next: Visualization';
            case 3: return 'Finish Setup';
            case 4: return 'Start My First Session';
            default: return 'Next';
        }
    };

    return (
        <div className="onboarding-container">
            <div className="onboarding-card">

                {/* Step content */}
                {step === 0 && (
                    <div className="onboarding-step">
                        <div className="onboarding-header">
                            <h1 className="onboarding-logo">Welcome to Araw</h1>
                        </div>
                        <div className="onboarding-body">
                            <p>Araw is a daily journaling ritual that helps you think about the right things every day.</p>
                            <p>You'll set up three foundation pages once, then revisit them every day before you write.</p>
                            <ul className="onboarding-list">
                                <li>Clarify what you're working toward <span className="list-hint">(goals)</span>.</li>
                                <li>Remind yourself who you're becoming <span className="list-hint">(affirmations)</span>.</li>
                                <li>Feel the life you're building into <span className="list-hint">(visualization)</span>.</li>
                            </ul>
                        </div>
                    </div>
                )}

                {step === 1 && (
                    <div className="onboarding-step">
                        <div className="onboarding-header">
                            <h1>Page 1: Define Your Goals</h1>
                            <p>This page answers, <em>"What am I actually trying to accomplish?"</em></p>
                            <p>You'll read these goals every morning so you stop drifting and keep steering your life and work on purpose.</p>
                        </div>
                        <div className="onboarding-field">
                            <SmartTextarea
                                className="onboarding-textarea"
                                value={goals}
                                onChange={(e) => setGoals(e.target.value)}
                                placeholder="List your goals here..."
                                autoFocus
                            />
                            <div className="field-helper">
                                List 3–7 goals across the areas that matter most (career, finances, health, relationships, creativity, faith, etc.).
                                <button className="tooltip-toggle" onClick={() => setGoalsTooltip(!goalsTooltip)}>
                                    {goalsTooltip ? 'Hide example' : 'See an example'}
                                </button>
                            </div>
                            {goalsTooltip && (
                                <div className="tooltip-box">
                                    <p>Career: Secure a fully remote AI engineering/strategy role that values impact over location.</p>
                                    <p>Health: Reach 80kg and run 5K comfortably.</p>
                                    <p>Money: Become debt-free and build one year of expenses in cash.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="onboarding-step">
                        <div className="onboarding-header">
                            <h1>Page 2: Affirm Who You're Becoming</h1>
                            <p>This page reminds you of your identity and values so you show up as your future self, not your old habits.</p>
                            <p>You'll read these lines daily until they feel natural.</p>
                        </div>
                        <div className="onboarding-field">
                            <SmartTextarea
                                className="onboarding-textarea"
                                value={affirmations}
                                onChange={(e) => setAffirmations(e.target.value)}
                                placeholder="I am..."
                                autoFocus
                            />
                            <div className="field-helper">
                                Write 5–10 "I am…" or "I choose…" statements that describe the person you're becoming.
                                <button className="tooltip-toggle" onClick={() => setAffTooltip(!affTooltip)}>
                                    {affTooltip ? 'Hide examples' : 'Sample affirmations'}
                                </button>
                            </div>
                            {affTooltip && (
                                <div className="tooltip-box">
                                    <p>I am a technical leader whose work creates real impact.</p>
                                    <p>I am disciplined—I move my body, pray, and focus on what matters before work.</p>
                                    <p>I choose focus over distraction and long-term building over short-term comfort.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="onboarding-step">
                        <div className="onboarding-header">
                            <h1>Page 3: Visualize Your Future</h1>
                            <p>This page is a vivid snapshot of your life when things are working—how you look, where you live, how you spend your days.</p>
                            <p>You'll read it every morning to remember what you're building toward and to feel it now.</p>
                        </div>
                        <div className="onboarding-field">
                            <SmartTextarea
                                className="onboarding-textarea"
                                value={visualizations}
                                onChange={(e) => setVisualizations(e.target.value)}
                                placeholder="I see myself..."
                                autoFocus
                            />
                            <div className="field-helper">
                                Describe a day in your life one year from now. Write in present tense, as if it's already true.
                                <button className="tooltip-toggle" onClick={() => setVizTooltip(!vizTooltip)}>
                                    {vizTooltip ? 'Hide example' : 'Short example'}
                                </button>
                            </div>
                            {vizTooltip && (
                                <div className="tooltip-box">
                                    <p>"I wake up at 6 AM, 80kg, clear-headed. I work remotely from home, ship meaningful AI projects, review a profitable trading journal at lunch, and end the day present with my wife—debt-free and planning our next trip."</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="onboarding-step onboarding-summary">
                        <div className="onboarding-header">
                            <h1>Your Daily Session</h1>
                        </div>
                        <div className="onboarding-body">
                            <p>Each morning, Araw will guide you to:</p>
                            <ul className="onboarding-list onboarding-list--numbered">
                                <li>Reread your Goals, Affirmations, and Visualization.</li>
                                <li>Freewrite one page to clear your mind.</li>
                                <li>Answer one focused prompt to choose your most important action.</li>
                            </ul>
                        </div>
                    </div>
                )}

            </div>

            {/* Progress dots — fixed bottom center */}
            <div className="onboarding-dots">
                {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                    <div key={i} className={`dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
                ))}
            </div>

            {/* Footer buttons — fixed bottom right */}
            <div className="onboarding-footer">
                {step > 0 && (
                    <button className="btn-back" onClick={handleBack}>
                        Back
                    </button>
                )}
                <button className="btn-primary" onClick={handleNext}>
                    {ctaLabel()}
                </button>
            </div>
        </div>
    );
}
