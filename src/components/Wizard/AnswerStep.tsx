import { useState, useRef, useEffect } from 'react';
import type { Prompt } from '../../types/models';

interface AnswerStepProps {
    prompt: Prompt | null;
    actions: string[];
    onAddAction: (text: string) => void;
    onRemoveAction: (index: number) => void;
    onDone: () => void;
}

export function AnswerStep({
    prompt,
    actions,
    onAddAction,
    onRemoveAction,
    onDone
}: AnswerStepProps) {
    const [newAction, setNewAction] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleAddAction = () => {
        if (newAction.trim()) {
            onAddAction(newAction.trim());
            setNewAction('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleAddAction();
        }
    };

    return (
        <div className="answer-step">
            <div className="answer-prompt">
                <p className="answer-prompt-text">{prompt?.text || 'What actions will you take today?'}</p>
            </div>

            <div className="answer-actions">
                <div className="answer-actions-header">Actions</div>
                <div className="answer-action-input">
                    <input
                        ref={inputRef}
                        type="text"
                        value={newAction}
                        onChange={(e) => setNewAction(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Add an action..."
                    />
                    <button onClick={handleAddAction}>Add</button>
                </div>

                {actions.length > 0 && (
                    <div className="answer-action-list">
                        {actions.map((action, i) => (
                            <div key={i} className="answer-action-item">
                                <span>• {action}</span>
                                <button className="answer-action-remove" onClick={() => onRemoveAction(i)}>
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="answer-footer">
                <button onClick={onDone}>
                    Complete Session
                </button>
            </div>
        </div>
    );
}
