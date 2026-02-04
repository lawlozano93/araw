import type { Prompt } from '../../types/models';

interface PromptsStepProps {
    prompts: Prompt[];
    selectedPrompt: Prompt | null;
    onSelect: (prompt: Prompt) => void;
    onDone: () => void;
}

export function PromptsStep({ prompts, selectedPrompt, onSelect, onDone }: PromptsStepProps) {
    return (
        <div className="prompts-step">
            <div className="prompts-title">Choose a prompt to reflect on</div>
            <div className="prompts-list">
                {prompts.map(prompt => (
                    <div
                        key={prompt.id}
                        className={`prompt-item ${selectedPrompt?.id === prompt.id ? 'selected' : ''}`}
                        onClick={() => onSelect(prompt)}
                    >
                        <div className="prompt-text">{prompt.text}</div>
                    </div>
                ))}
            </div>
            <div className="prompts-footer">
                <button onClick={onDone} disabled={!selectedPrompt}>
                    Continue
                </button>
            </div>
        </div>
    );
}
