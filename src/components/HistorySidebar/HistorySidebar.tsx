import { useState, useEffect, useMemo } from 'react';
import { listEntries, loadEntry } from '../../hooks/useStorage';
import type { JournalEntry } from '../../types/models';
import './HistorySidebar.css';

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectEntry: (date: string) => void;
}

interface EntryPreview {
    date: string;
    preview: string;
}

export function HistorySidebar({ isOpen, onClose, onSelectEntry }: HistorySidebarProps) {
    const [entries, setEntries] = useState<EntryPreview[]>([]);
    const [entryDates, setEntryDates] = useState<Set<string>>(new Set());
    const [selectedMonth, setSelectedMonth] = useState(new Date());

    useEffect(() => {
        if (isOpen) {
            loadEntries();
        }
    }, [isOpen]);

    const loadEntries = async () => {
        try {
            const dates = await listEntries();
            setEntryDates(new Set(dates));

            // Load previews for recent entries
            const previews: EntryPreview[] = [];
            for (const date of dates.slice(0, 10)) {
                const entry = await loadEntry(date);
                if (entry) {
                    const preview = entry.streamText?.slice(0, 40) || entry.answerText?.slice(0, 40) || '';
                    previews.push({ date, preview: preview + (preview.length >= 40 ? '...' : '') });
                }
            }
            setEntries(previews);
        } catch (e) {
            // Fallback - just show empty
            setEntries([]);
        }
    };

    // Calendar data
    const calendarDays = useMemo(() => {
        const year = selectedMonth.getFullYear();
        const month = selectedMonth.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days: (number | null)[] = [];

        // Add empty slots for days before first of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        // Add days of month
        for (let d = 1; d <= lastDay.getDate(); d++) {
            days.push(d);
        }

        return days;
    }, [selectedMonth]);

    const monthLabel = selectedMonth.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    const prevMonth = () => {
        setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));
    };

    const formatDateForCheck = (day: number) => {
        const d = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
        return d.toISOString().split('T')[0];
    };

    const formatEntryDate = (dateStr: string) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (!isOpen) return null;

    return (
        <div className="history-sidebar">
            <div className="history-header">
                <span>History ↗</span>
                <button className="history-close" onClick={onClose}>×</button>
            </div>

            {/* Mini Calendar */}
            <div className="mini-calendar">
                <div className="calendar-nav">
                    <button onClick={prevMonth}>‹</button>
                    <span>{monthLabel}</span>
                    <button onClick={nextMonth}>›</button>
                </div>
                <div className="calendar-weekdays">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                        <span key={i}>{d}</span>
                    ))}
                </div>
                <div className="calendar-days">
                    {calendarDays.map((day, i) => {
                        if (day === null) {
                            return <span key={i} className="calendar-empty" />;
                        }
                        const dateStr = formatDateForCheck(day);
                        const hasEntry = entryDates.has(dateStr);
                        const isToday = dateStr === new Date().toISOString().split('T')[0];

                        return (
                            <span
                                key={i}
                                className={`calendar-day ${hasEntry ? 'has-entry' : ''} ${isToday ? 'today' : ''}`}
                                onClick={() => hasEntry && onSelectEntry(dateStr)}
                            >
                                {day}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Entry List */}
            <div className="history-entries">
                {entries.map(entry => (
                    <div
                        key={entry.date}
                        className="history-entry"
                        onClick={() => onSelectEntry(entry.date)}
                    >
                        <div className="history-entry-preview">{entry.preview || 'No content'}</div>
                        <div className="history-entry-date">{formatEntryDate(entry.date)}</div>
                    </div>
                ))}
                {entries.length === 0 && (
                    <div className="history-empty">No entries yet</div>
                )}
            </div>
        </div>
    );
}
