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
            <div className="answer-step-scroll">
                <div className="answer-step-inner">
                    <div className="prompts-single-question">
                        {prompt?.text || 'What is the ONE most important thing I must do today?'}
                    </div>

                    <div className="answer-section">
                        <input
                            ref={inputRef}
                            type="text"
                            className="main-answer-input"
                            value={mainAnswer}
                            onChange={(e) => onMainAnswerChange(e.target.value)}
                            placeholder="Type here..."
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && mainAnswer.trim()) {
                                    onDone();
                                }
                            }}
                        />
                    </div>
                </div>
            </div>

            <div className="wizard-step-footer">
                <button onClick={onDone} disabled={!mainAnswer.trim()}>
                    Complete Session
                </button>
            </div>
        </div>
    );
}
