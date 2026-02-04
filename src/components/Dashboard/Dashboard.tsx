import { useState, useEffect } from 'react';
import { loadEntry } from '../../hooks/useStorage';
import type { JournalEntry } from '../../types/models';

interface DashboardProps {
    onStartSession: () => void;
    testDate: string;
    session: {
        readGoals: boolean;
        readAffirmations: boolean;
        readVisualizations: boolean;
        promptsReviewed: boolean;
        streamDone: boolean;
        promptAnswered: boolean;
    } | null;
    actions: Array<{ id: string; text: string; done: boolean; completedAt?: string }>;
    onToggleAction: (id: string) => void;
}

export function Dashboard({ onStartSession, testDate, session, actions, onToggleAction }: DashboardProps) {
    const [entry, setEntry] = useState<JournalEntry | null>(null);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const displayDate = new Date(testDate + 'T12:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    const completedSteps = session ? [
        session.readGoals,
        session.readAffirmations,
        session.readVisualizations,
        session.promptsReviewed,
        session.streamDone,
        session.promptAnswered,
    ].filter(Boolean).length : 0;

    const isComplete = completedSteps === 6;

    // Load entry content when complete
    useEffect(() => {
        if (isComplete) {
            loadEntry(testDate).then(setEntry).catch(() => setEntry(null));
        }
    }, [isComplete, testDate]);

    return (
        <div className="dashboard">
            <h1 className="dashboard-greeting">{greeting()}</h1>
            <p className="dashboard-date">{displayDate}</p>

            {!isComplete && (
                <>
                    <p className="session-prompt">
                        {completedSteps === 0
                            ? "Ready to start your session?"
                            : `Continue where you left off (step ${completedSteps + 1} of 6)`
                        }
                    </p>
                    <button className="start-btn" onClick={onStartSession}>
                        {completedSteps === 0 ? 'Start Session' : 'Continue'}
                    </button>
                </>
            )}

            {isComplete && (
                <>
                    <p className="session-prompt" style={{ color: 'var(--primary)' }}>
                        ✓ Session complete
                    </p>

                    {/* Show entry content */}
                    {entry && (
                        <div className="entry-preview">
                            {entry.streamText && (
                                <div className="entry-preview-section">
                                    <div className="entry-preview-label">Stream</div>
                                    <div className="entry-preview-content">{entry.streamText}</div>
                                </div>
                            )}

                            {entry.promptText && (
                                <div className="entry-preview-section">
                                    <div className="entry-preview-label">Prompt</div>
                                    <div className="entry-preview-prompt">{entry.promptText}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Show actions */}
                    {actions && actions.length > 0 && (
                        <div className="actions-section">
                            <div className="actions-header">Actions</div>
                            {actions.map(action => (
                                <div
                                    key={action.id}
                                    className={`action-item ${action.done ? 'done' : ''}`}
                                    onClick={() => onToggleAction(action.id)}
                                >
                                    <div className={`action-checkbox ${action.done ? 'checked' : ''}`}>
                                        {action.done && '✓'}
                                    </div>
                                    <span className="action-text">{action.text}</span>
                                    {action.done && action.completedAt && (
                                        <span className="action-time">
                                            {new Date(action.completedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
