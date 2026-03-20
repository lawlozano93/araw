import { useMemo } from 'react';
import type { Prompt } from '../../types/models';

interface PromptStepProps {
  prompts: Prompt[];
  selectedPromptId: string;
  onSelectPrompt: (prompt: Prompt) => void;
  onDone: () => void;
}

export function PromptStep({
  prompts,
  selectedPromptId,
  onSelectPrompt,
  onDone,
}: PromptStepProps) {
  const selected = useMemo(
    () => prompts.find(p => p.id === selectedPromptId) ?? prompts[0],
    [prompts, selectedPromptId]
  );

  const orderedPrompts = useMemo(() => {
    // Favorites first, then the rest (stable by original array order).
    const favorites = prompts.filter(p => p.isFavorite);
    const others = prompts.filter(p => !p.isFavorite);
    return [...favorites, ...others];
  }, [prompts]);

  return (
    <div className="prompts-step">
      <div className="prompts-title">Answer a prompt</div>

      <div className="prompts-list" role="list">
        {orderedPrompts.map(prompt => (
          <button
            key={prompt.id}
            type="button"
            className={`prompt-item ${prompt.id === selected?.id ? 'selected' : ''}`}
            onClick={() => onSelectPrompt(prompt)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectPrompt(prompt);
              }
            }}
          >
            <div className="prompt-text">{prompt.text}</div>
          </button>
        ))}
      </div>

      <div className="prompts-footer">
        <button type="button" onClick={onDone} disabled={!selected}>
          Continue
        </button>
      </div>
    </div>
  );
}

