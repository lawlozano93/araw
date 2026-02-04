import { useState } from 'react';
import { savePage, loadConfig, saveConfig } from '../../hooks/useStorage';
import './Onboarding.css';

interface OnboardingProps {
    onComplete: () => void;
}

export function Onboarding({ onComplete }: OnboardingProps) {
    const [step, setStep] = useState(0);
    const [goals, setGoals] = useState('Build meaningful products\nDevelop consistent habits\nLive intentionally');
    const [affirmations, setAffirmations] = useState('I am capable of achieving my goals\nI choose to focus on what matters\nI am becoming better every day');
    const [visualizations, setVisualizations] = useState('Imagine yourself one year from now, having achieved your goals...');

    const handleNext = async () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            // Save everything
            await savePage('goals', `# My Goals\n\n${goals}`);
            await savePage('affirmations', `# Affirmations\n\n${affirmations}`);
            await savePage('visualizations', `# Visualizations\n\n${visualizations}`);

            // Mark onboarding as complete
            const config = await loadConfig();
            await saveConfig({ ...config, onboardingComplete: true });

            onComplete();
        }
    };

    const steps = [
        {
            title: "Welcome to Frontal Lobe",
            subtitle: "Your daily journaling companion for high performance.",
            content: (
                <div className="onboarding-welcome">
                    <p>Frontal Lobe helps you start your day with intention.</p>
                    <ul className="feature-list">
                        <li>🎯 <strong>Review Goals</strong> to stay aligned.</li>
                        <li>🧠 <strong>Recite Affirmations</strong> to prime your mindset.</li>
                        <li>👁️ <strong>Visualize Success</strong> to create motivation.</li>
                        <li>📝 <strong>Conscious Stream</strong> to clear your mind.</li>
                    </ul>
                </div>
            )
        },
        {
            title: "Set Your Goals",
            subtitle: "What are you working towards?",
            content: (
                <textarea
                    className="onboarding-textarea"
                    value={goals}
                    onChange={e => setGoals(e.target.value)}
                    placeholder="List your top 3 goals..."
                />
            )
        },
        {
            title: "Define Affirmations",
            subtitle: "What truths do you need to remind yourself of?",
            content: (
                <textarea
                    className="onboarding-textarea"
                    value={affirmations}
                    onChange={e => setAffirmations(e.target.value)}
                    placeholder="I am..."
                />
            )
        },
        {
            title: "Create a Visualization",
            subtitle: "Describe your ideal future state in detail.",
            content: (
                <textarea
                    className="onboarding-textarea"
                    value={visualizations}
                    onChange={e => setVisualizations(e.target.value)}
                    placeholder="I see myself..."
                />
            )
        }
    ];

    const currentStep = steps[step];

    return (
        <div className="onboarding-container">
            <div className="onboarding-card">
                <div className="onboarding-progress">
                    {steps.map((_, i) => (
                        <div key={i} className={`progress-dot ${i <= step ? 'active' : ''}`} />
                    ))}
                </div>

                <div className="onboarding-header">
                    <h1>{currentStep.title}</h1>
                    <p>{currentStep.subtitle}</p>
                </div>

                <div className="onboarding-content">
                    {currentStep.content}
                </div>

                <div className="onboarding-footer">
                    <button className="btn-primary" onClick={handleNext}>
                        {step === steps.length - 1 ? "Get Started" : "Next"}
                    </button>
                </div>
            </div>
        </div>
    );
}
