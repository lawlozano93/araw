import { useState, useEffect, useRef } from 'react';

interface StreamStepProps {
    value: string;
    onChange: (value: string) => void;
    onDone: () => void;
}

const PLACEHOLDERS = [
    "What's on your mind",
    "Begin writing...",
    "Start with today's date...",
    "Just start typing...",
];

export function StreamStep({ value, onChange, onDone }: StreamStepProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [placeholder] = useState(() =>
        PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]
    );

    useEffect(() => {
        textareaRef.current?.focus();
    }, []);

    return (
        <div className="stream-step">
            <div className="stream-editor">
                <textarea
                    ref={textareaRef}
                    className="stream-textarea"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                />
            </div>
            <div className="stream-footer">
                <button
                    className="btn btn-primary"
                    onClick={onDone}
                    disabled={!value.trim()}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
