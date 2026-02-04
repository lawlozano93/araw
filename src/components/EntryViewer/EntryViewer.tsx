import { useState, useEffect } from 'react';
import { loadEntry } from '../../hooks/useStorage';
import type { JournalEntry } from '../../types/models';
import './EntryViewer.css';

interface EntryViewerProps {
    date: string;
    onClose: () => void;
}

export function EntryViewer({ date, onClose }: EntryViewerProps) {
    const [entry, setEntry] = useState<JournalEntry | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadEntry(date)
            .then(setEntry)
            .catch(() => setEntry(null))
            .finally(() => setLoading(false));
    }, [date]);

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    if (loading) {
        return (
            <div className="entry-viewer">
                <div className="entry-viewer-loading">Loading...</div>
            </div>
        );
    }

    if (!entry) {
        return (
            <div className="entry-viewer">
                <div className="entry-viewer-empty">
                    <p>No entry found for this date.</p>
                    <button className="entry-back" onClick={onClose}>← Back</button>
                </div>
            </div>
        );
    }

    return (
        <div className="entry-viewer">
            <div className="entry-viewer-header">
                <h1 className="entry-viewer-date">{formattedDate}</h1>
            </div>

            <div className="entry-viewer-content">
                {entry.streamText && (
                    <section className="entry-section">
                        <h2 className="entry-section-title">Conscious Stream</h2>
                        <div className="entry-section-content">{entry.streamText}</div>
                    </section>
                )}

                {entry.promptText && (
                    <section className="entry-section">
                        <h2 className="entry-section-title">Prompt</h2>
                        <div className="entry-prompt-text">{entry.promptText}</div>
                        {entry.answerText && (
                            <div className="entry-section-content">{entry.answerText}</div>
                        )}
                    </section>
                )}

                {entry.actions && entry.actions.length > 0 && (
                    <section className="entry-section">
                        <h2 className="entry-section-title">Actions</h2>
                        <div className="entry-actions">
                            {entry.actions.map(action => (
                                <div key={action.id} className={`entry-action ${action.done ? 'done' : ''}`}>
                                    <span className="entry-action-check">{action.done ? '✓' : '○'}</span>
                                    <span>{action.text}</span>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            <button className="entry-back" onClick={onClose}>← Back to Today</button>
        </div>
    );
}
