import { useState, useEffect, useRef } from 'react';
import { useTimer } from '../../hooks/useTimer';

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

    // Timer logic
    const timer = useTimer(0);
    const autoStartTimeoutRef = useRef<number | null>(null);
    const [isTimerVisible, setIsTimerVisible] = useState(true);

    const handleAddFormattedTime = () => {
        // Add 5 minutes
        timer.addTime(5);

        // Reset auto-start timeout
        if (autoStartTimeoutRef.current) {
            clearTimeout(autoStartTimeoutRef.current);
        }

        // Auto-start after 2 seconds of inactivity
        autoStartTimeoutRef.current = window.setTimeout(() => {
            if (!timer.isRunning) {
                timer.start();
            }
        }, 2000);
    };

    const handleClearTimer = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (autoStartTimeoutRef.current) {
            clearTimeout(autoStartTimeoutRef.current);
        }
        timer.reset();
        setIsTimerVisible(false);
    };

    useEffect(() => {
        textareaRef.current?.focus();
        return () => {
            if (autoStartTimeoutRef.current) clearTimeout(autoStartTimeoutRef.current);
        };
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
            <div className="wizard-step-footer">
                {isTimerVisible ? (
                    <div
                        className={`stream-timer ${timer.isRunning ? 'running' : ''} ${timer.displayTime === '00:00' ? 'empty' : ''}`}
                        onClick={handleAddFormattedTime}
                        title="Click to add 5 minutes"
                    >
                        {timer.displayTime === '00:00' ? (
                            <span className="timer-placeholder">+ Add time</span>
                        ) : (
                            <>
                                <span className="timer-display">{timer.displayTime}</span>
                                <button className="timer-clear" onClick={handleClearTimer} title="Clear timer">×</button>
                            </>
                        )}
                    </div>
                ) : (
                    <button
                        className="stream-timer-show"
                        onClick={() => setIsTimerVisible(true)}
                        title="Show timer"
                    >
                        ⏱️ Show Timer
                    </button>
                )}
                <button
                    onClick={onDone}
                    disabled={!value.trim()}
                >
                    Continue
                </button>
            </div>
        </div>
    );
}
