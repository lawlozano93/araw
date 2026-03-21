import { useState, useEffect, useMemo } from 'react';
import { listEntries, loadEntry } from '../../hooks/useStorage';
import { useSound } from '../../hooks/useSound';
import './HistorySidebar.css';

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectEntry: (date: string) => void;
}

interface EntryPreview {
    date: string;
    preview: string;
    inProgress?: boolean;
}

export function HistorySidebar({ isOpen, onClose, onSelectEntry }: HistorySidebarProps) {
    const [entries, setEntries] = useState<EntryPreview[]>([]);
    const [entryDates, setEntryDates] = useState<Set<string>>(new Set());
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const playSound = useSound();

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
            const recentDates = dates.slice(0, 10);
            const entryResults = await Promise.all(
                recentDates.map(async (date) => {
                    try {
                        return { date, entry: await loadEntry(date) };
                    } catch {
                        return { date, entry: null };
                    }
                })
            );

            for (const result of entryResults) {
                if (result.entry) {
                    const preview =
                        result.entry.streamText?.slice(0, 40) || result.entry.answerText?.slice(0, 40) || '';
                    const trimmed = preview + (preview.length >= 40 ? '...' : '');
                    previews.push({ date: result.date, preview: trimmed, inProgress: result.entry.inProgress });
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
        playSound();
        setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        playSound();
        setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1));
    };

    const formatDateForCheck = (day: number) => {
        const d = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const date = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${date}`;
    };

    const formatEntryDate = (dateStr: string) => {
        const [y, m, d] = dateStr.split('-').map(Number);
        return new Date(y, (m || 1) - 1, d || 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (!isOpen) return null;

    return (
        <div className="history-sidebar">
            <div className="history-header">
                <span>History ↗</span>
                    <button type="button" className="history-close" onClick={() => { playSound(); onClose(); }} aria-label="Close history">×</button>
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
                        const now = new Date();
                        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                        const isToday = dateStr === todayStr;

                        return (
                            <button
                                type="button"
                                key={i}
                                className={`calendar-day ${hasEntry ? 'has-entry' : ''} ${isToday ? 'today' : ''}`}
                                disabled={!hasEntry}
                                aria-label={hasEntry ? `Open entry for ${formatEntryDate(dateStr)}` : `No entry for ${formatEntryDate(dateStr)}`}
                                onClick={() => {
                                    playSound();
                                    onSelectEntry(dateStr);
                                }}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Entry List */}
            <div className="history-entries">
                {entries.map(entry => (
                    <button
                        key={entry.date}
                        className="history-entry"
                        onClick={() => {
                            playSound();
                            onSelectEntry(entry.date);
                        }}
                    >
                        <div className="history-entry-preview">
                            {entry.inProgress ? <span className="in-progress">In progress • </span> : null}
                            {entry.preview || 'No content'}
                        </div>
                        <div className="history-entry-date">{formatEntryDate(entry.date)}</div>
                    </button>
                ))}
                {entries.length === 0 && (
                    <div className="history-empty">No entries yet</div>
                )}
            </div>
        </div>
    );
}
