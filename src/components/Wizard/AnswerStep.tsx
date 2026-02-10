import { useRef, useEffect } from 'react';
import type { Prompt } from '../../types/models';

interface AnswerStepProps {
    prompt: Prompt | null;
    mainAnswer: string;
    onMainAnswerChange: (text: string) => void;
    onDone: () => void;
}

export function AnswerStep({
    prompt,
    mainAnswer,
    onMainAnswerChange,
    onDone
}: AnswerStepProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    return (
        <div className="answer-step">
            <div className="prompts-single-question" style={{ marginBottom: '32px' }}>
                {prompt?.text || 'What is the ONE most important thing I must do today?'}
            </div>

            <div className="answer-section" style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
                <input
                    ref={inputRef}
                    type="text"
                    className="main-answer-input"
                    value={mainAnswer}
                    onChange={(e) => onMainAnswerChange(e.target.value)}
                    placeholder="Type here..."
                    style={{
                        width: '100%',
                        padding: '20px 0',
                        fontSize: '24px',
                        border: 'none',
                        borderBottom: '2px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--foreground)',
                        textAlign: 'center',
                        outline: 'none',
                        marginBottom: '40px'
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && mainAnswer.trim()) {
                            onDone();
                        }
                    }}
                />
            </div>

            <div className="wizard-step-footer">
                <button onClick={onDone} disabled={!mainAnswer.trim()}>
                    Complete Session
                </button>
            </div>
        </div>
    );
}
