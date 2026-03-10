import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { loadEntry, getToday } from '../../hooks/useStorage';
import type { JournalEntry, ActionItem } from '../../types/models';

interface DashboardProps {
    onStartSession: () => void;
    session: {
        readGoals: boolean;
        readAffirmations: boolean;
        readVisualizations: boolean;
        promptsReviewed: boolean;
        streamDone: boolean;
        promptAnswered: boolean;
    } | null;
    actions: ActionItem[];
    onToggleAction: (id: string) => void;
    onAddAction?: (text: string) => void;
    onDeleteAction?: (id: string) => void;
}

export function Dashboard({ onStartSession, session, actions, onToggleAction, onAddAction, onDeleteAction }: DashboardProps) {
    const [entry, setEntry] = useState<JournalEntry | null>(null);

    const greeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const displayDate = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
    });

    const completedSteps = session ? [
        session.readGoals,
        session.readAffirmations,
        session.readVisualizations,
        session.streamDone,
        session.promptAnswered,
    ].filter(Boolean).length : 0;

    const isComplete = !!session?.promptAnswered;

    // Load entry content when complete
    useEffect(() => {
        if (isComplete) {
            loadEntry(getToday()).then(setEntry).catch(() => setEntry(null));
        }
    }, [isComplete]);

    const mainAction = actions?.find(a => a.isMain);
    const otherActions = actions?.filter(a => !a.isMain) || [];
    const [newActionText, setNewActionText] = useState('');

    const handleAddAction = () => {
        if (newActionText.trim() && onAddAction) {
            onAddAction(newActionText.trim());
            setNewActionText('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleAddAction();
    };

    return (
        <div className="dashboard">
            <div className="dashboard-header-flex">
                <div>
                    <h1 className="dashboard-greeting">{greeting()}</h1>
                    <p className="dashboard-date">{displayDate}</p>
                </div>
                {isComplete && (
                    <div className="session-complete-indicator">
                        ✓ Session complete
                    </div>
                )}
            </div>

            {!isComplete && (
                <>
                    <p className="session-prompt">
                        {completedSteps === 0
                            ? "Ready to start your session?"
                            : `Continue where you left off (step ${completedSteps + 1} of 5)`
                        }
                    </p>
                    <button className="start-btn" onClick={onStartSession}>
                        {completedSteps === 0 ? 'Start Session' : 'Continue'}
                    </button>
                </>
            )}

            {isComplete && (
                <>
                    {/* Conscious Stream Display */}
                    {entry?.streamText && (
                        <div className="stream-section">
                            <div className="stream-label">Conscious Stream</div>
                            <div className="stream-content">{entry.streamText}</div>
                        </div>
                    )}

                    {/* Main Goal Section */}
                    <div className="main-goal-section">
                        <div className="current-prompt-text">
                            What is the ONE most important thing I must do today to move closer to what I want?
                        </div>

                        {mainAction ? (
                            <div
                                className={`main-goal-item ${mainAction.done ? 'done' : ''}`}
                                onClick={() => onToggleAction(mainAction.id)}
                            >
                                <div className={`action-checkbox ${mainAction.done ? 'checked' : ''}`}>
                                    {mainAction.done && '✓'}
                                </div>
                                <span className="action-text">{mainAction.text}</span>
                            </div>
                        ) : (
                            <div className="awaiting-answer">
                                Awaiting answer...
                            </div>
                        )}
                    </div>

                    {/* Other Actions Section */}
                    <div className="actions-section">
                        <div className="actions-header">Additional To-Dos</div>

                        <div className="actions-list">
                            {otherActions.map(action => (
                                <div
                                    key={action.id}
                                    className={`action-item ${action.done ? 'done' : ''}`}
                                    onClick={() => onToggleAction(action.id)}
                                >
                                    <div className={`action-checkbox ${action.done ? 'checked' : ''}`}>
                                        {action.done && '✓'}
                                    </div>
                                    <span className="action-text">{action.text}</span>

                                    {onDeleteAction && (
                                        <div
                                            className="delete-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteAction(action.id);
                                            }}
                                            title="Delete task"
                                        >
                                            <Trash2 size={14} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Quick Add Action */}
                        {onAddAction && (
                            <div className="dash-add-action" style={{ display: 'flex', gap: '12px', padding: '8px 0', marginTop: '0', alignItems: 'center' }}>
                                <div className="action-checkbox" style={{ opacity: 0.4 }}></div>

                                <input
                                    type="text"
                                    value={newActionText}
                                    onChange={(e) => setNewActionText(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Add task..."
                                    style={{
                                        flex: 1,
                                        background: 'transparent',
                                        border: 'none',
                                        padding: '0',
                                        fontSize: '15px',
                                        color: 'var(--foreground)',
                                        outline: 'none'
                                    }}
                                />
                                {newActionText.length > 0 && (
                                    <button
                                        onClick={handleAddAction}
                                        disabled={!newActionText.trim()}
                                        style={{
                                            background: 'var(--primary)',
                                            color: 'var(--primary-foreground)',
                                            border: 'none',
                                            borderRadius: '4px',
                                            padding: '4px 12px',
                                            fontSize: '12px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        Add
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
