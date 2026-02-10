
interface ReadingStepProps {
    title: string;
    content: string;
    onDone: () => void;
}

export function ReadingStep({ title, content, onDone }: ReadingStepProps) {
    // Strip markdown headers for cleaner display
    const cleanContent = content
        .replace(/^#+ .+$/gm, '') // Remove headers
        .trim();

    return (
        <div className="reading-step">
            <div className="reading-content">
                {cleanContent}
            </div>
            <div className="wizard-step-footer">
                <button onClick={onDone}>
                    Done Reading
                </button>
            </div>
        </div>
    );
}
