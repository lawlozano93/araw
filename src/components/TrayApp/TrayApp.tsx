import { useState, useRef, useEffect } from 'react';
import { useSession, useActions, useTheme } from '../../hooks/useSession';
import { loadPage, loadConfig } from '../../hooks/useStorage';
import { invoke } from '@tauri-apps/api/core';
import { getCurrentWindow } from '@tauri-apps/api/window';
import './TrayApp.css';

export function TrayApp() {
    const { session, completedSteps, isComplete, updateSession } = useSession();
    const { actions, addAction, toggleAction } = useActions();
    const { theme: _theme } = useTheme(); // Sync theme

    // State for expanded sections and items
    const [expandedSection, setExpandedSection] = useState<'inputs' | 'actions' | null>('inputs');
    const [expandedItem, setExpandedItem] = useState<string | null>(null);

    // Content state
    const [goals, setGoals] = useState<string>('');
    const [affirmations, setAffirmations] = useState<string>('');
    const [visualizations, setVisualizations] = useState<string>('');
    const [streak, setStreak] = useState<number>(0);

    const [newAction, setNewAction] = useState('');
    const actionInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const loadContent = () => {
            loadPage('goals').then(setGoals).catch(() => { });
            loadPage('affirmations').then(setAffirmations).catch(() => { });
            loadPage('visualizations').then(setVisualizations).catch(() => { });
            loadConfig().then(config => setStreak(config.currentStreak)).catch(() => { });
        };

        // Load on mount
        loadContent();

        // Reload whenever the tray window regains focus (e.g. after Settings changes)
        window.addEventListener('focus', loadContent);
        return () => window.removeEventListener('focus', loadContent);
    }, []);

    const handleOpenMain = async () => {
        try {
            await invoke('show_main_window');
            await getCurrentWindow().hide();
        } catch (e) {
            console.error("Failed to open main window", e);
        }
    };

    const handleStartSession = async () => {
        await handleOpenMain();
    };

    const handleAddAction = () => {
        if (newAction.trim()) {
            addAction(newAction.trim());
            setNewAction('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleAddAction();
        }
    };

    const toggleItem = (item: string) => {
        setExpandedItem(expandedItem === item ? null : item);
    };

    const toggleSessionBool = (e: React.MouseEvent, key: 'readGoals' | 'readAffirmations' | 'readVisualizations' | 'promptsReviewed') => {
        e.stopPropagation();
        if (session) {
            updateSession({ [key]: !session[key] });
        }
    };

    // Inputs progress
    const inputsTotal = 4;
    const inputsCompleted = (session?.readGoals ? 1 : 0) +
        (session?.readAffirmations ? 1 : 0) +
        (session?.readVisualizations ? 1 : 0) +
        (session?.promptsReviewed ? 1 : 0);

    const actionsCompleted = actions.filter(a => a.done).length;

    const formatDate = () => {
        return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Global Shortcuts
            if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
                e.preventDefault();
                setExpandedSection('actions');
                setTimeout(() => actionInputRef.current?.focus(), 50);
                return;
            }
            if ((e.metaKey || e.ctrlKey) && e.key === 'o') {
                e.preventDefault();
                handleOpenMain();
                return;
            }

            // Arrow Navigation
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                const focusableSelector = '[tabindex="0"], button:not(:disabled), input:not(:disabled)';
                const elements = Array.from(document.querySelectorAll(focusableSelector)) as HTMLElement[];
                const active = document.activeElement as HTMLElement;
                const index = elements.indexOf(active);

                if (index === -1) {
                    // Focus first element if nothing selected
                    if (elements.length > 0) elements[0].focus();
                } else {
                    e.preventDefault();
                    let nextIndex = e.key === 'ArrowDown' ? index + 1 : index - 1;
                    if (nextIndex >= 0 && nextIndex < elements.length) {
                        elements[nextIndex].focus();
                    }
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    const handleItemKeyDown = (e: React.KeyboardEvent, type: 'input' | 'action', id?: string) => {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault(); // Prevent scroll
            if (type === 'action' && id) {
                toggleAction(id);
            }
            if (type === 'input') {
                // Space toggles checkbox, Enter toggles expansion (default click on row does expansion)
                if (e.key === ' ' && id) {
                    // Map string id to session key
                    const map: Record<string, any> = {
                        'goals': 'readGoals',
                        'affirmations': 'readAffirmations',
                        'visualizations': 'readVisualizations',
                        'prompts': 'promptsReviewed'
                    };
                    if (map[id] && session) {
                        updateSession({ [map[id]]: !session[map[id] as keyof typeof session] });
                    }
                } else {
                    // Enter -> Expand
                    if (id && id !== 'prompts') toggleItem(id);
                    if (id === 'prompts') handleStartSession();
                }
            }
        }
    };

    return (
        <div className="tray-container dot-style">
            {/* Header */}
            <div className="tray-header">
                <div className="tray-date">{formatDate()}</div>
                <div className="tray-streak">🔥 {streak} {streak === 1 ? 'day' : 'days'}</div>
            </div>

            {/* Session CTA */}
            <div className="tray-section cta-section">
                {!isComplete ? (
                    <button className="tray-cta-btn" onClick={handleStartSession} tabIndex={0}>
                        <span className="cta-icon">▶</span>
                        <div className="cta-text">
                            <div className="cta-title">
                                {completedSteps === 0 ? "Start Session" : `Continue (Step ${completedSteps + 1})`}
                            </div>
                            <div className="cta-subtitle">Press ⏎ to start</div>
                        </div>
                    </button>
                ) : (
                    <div className="session-complete-banner" tabIndex={0}>
                        ✓ Session Complete
                    </div>
                )}
            </div>

            {/* INPUTS Section */}
            <div className="tray-section inputs-section">
                <div
                    className="section-header"
                    onClick={() => setExpandedSection(expandedSection === 'inputs' ? null : 'inputs')}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setExpandedSection(expandedSection === 'inputs' ? null : 'inputs') } }}
                >
                    <div className="section-title">INPUTS</div>
                    <div className="section-meta">{inputsCompleted}/{inputsTotal}</div>
                </div>

                {expandedSection === 'inputs' && (
                    <div className="section-content">
                        {/* Goals */}
                        <div className={`input-group ${expandedItem === 'goals' ? 'expanded' : ''}`}>
                            <div
                                className={`input-item ${session?.readGoals ? 'done' : ''}`}
                                onClick={() => toggleItem('goals')}
                                tabIndex={0}
                                onKeyDown={(e) => handleItemKeyDown(e, 'input', 'goals')}
                            >
                                <div className="input-checkbox" onClick={(e) => toggleSessionBool(e, 'readGoals')}>
                                    {session?.readGoals && '✓'}
                                </div>
                                <div className="input-label">Goals</div>
                                <div className="input-arrow">▼</div>
                            </div>
                            {expandedItem === 'goals' && (
                                <div className="input-details">
                                    {goals || <span className="empty-text">No goals set yet.</span>}
                                </div>
                            )}
                        </div>

                        {/* Affirmations */}
                        <div className={`input-group ${expandedItem === 'affirmations' ? 'expanded' : ''}`}>
                            <div
                                className={`input-item ${session?.readAffirmations ? 'done' : ''}`}
                                onClick={() => toggleItem('affirmations')}
                                tabIndex={0}
                                onKeyDown={(e) => handleItemKeyDown(e, 'input', 'affirmations')}
                            >
                                <div className="input-checkbox" onClick={(e) => toggleSessionBool(e, 'readAffirmations')}>
                                    {session?.readAffirmations && '✓'}
                                </div>
                                <div className="input-label">Affirmations</div>
                                <div className="input-arrow">▼</div>
                            </div>
                            {expandedItem === 'affirmations' && (
                                <div className="input-details">
                                    {affirmations || <span className="empty-text">No affirmations set yet.</span>}
                                </div>
                            )}
                        </div>

                        {/* Visualizations */}
                        <div className={`input-group ${expandedItem === 'visualizations' ? 'expanded' : ''}`}>
                            <div
                                className={`input-item ${session?.readVisualizations ? 'done' : ''}`}
                                onClick={() => toggleItem('visualizations')}
                                tabIndex={0}
                                onKeyDown={(e) => handleItemKeyDown(e, 'input', 'visualizations')}
                            >
                                <div className="input-checkbox" onClick={(e) => toggleSessionBool(e, 'readVisualizations')}>
                                    {session?.readVisualizations && '✓'}
                                </div>
                                <div className="input-label">Visualizations</div>
                                <div className="input-arrow">▼</div>
                            </div>
                            {expandedItem === 'visualizations' && (
                                <div className="input-details">
                                    {visualizations || <span className="empty-text">No visualizations set yet.</span>}
                                </div>
                            )}
                        </div>

                        <div
                            className={`input-item ${session?.promptsReviewed ? 'done' : ''}`}
                            onClick={handleStartSession}
                            tabIndex={0}
                            onKeyDown={(e) => handleItemKeyDown(e, 'input', 'prompts')}
                        >
                            <div className="input-checkbox" onClick={(e) => toggleSessionBool(e, 'promptsReviewed')}>
                                {session?.promptsReviewed && '✓'}
                            </div>
                            <div className="input-label">Prompts → Open App</div>
                        </div>
                    </div>
                )}
            </div>

            {/* ACTIONS Section */}
            <div className="tray-section actions-section">
                <div
                    className="section-header"
                    onClick={() => setExpandedSection(expandedSection === 'actions' ? null : 'actions')}
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setExpandedSection(expandedSection === 'actions' ? null : 'actions') } }}
                >
                    <div className="section-title">TODAY'S ACTIONS</div>
                    <div className="section-meta">{actionsCompleted}/{actions.length}</div>
                </div>

                {expandedSection === 'actions' && (
                    <div className="section-content">
                        {actions.map(action => (
                            <div
                                key={action.id}
                                className={`action-item ${action.done ? 'done' : ''}`}
                                onClick={() => toggleAction(action.id)}
                                tabIndex={0}
                                onKeyDown={(e) => handleItemKeyDown(e, 'action', action.id)}
                            >
                                <div className="action-checkbox">
                                    {action.done && '✓'}
                                </div>
                                <span className="action-text">{action.text}</span>
                            </div>
                        ))}

                        <div className="quick-add">
                            <span className="plus-icon">+</span>
                            <input
                                ref={actionInputRef}
                                type="text"
                                value={newAction}
                                onChange={(e) => setNewAction(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Add action..."
                            />
                            <span className="shortcut-hint">⌘N</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="tray-footer">
                <button className="footer-btn" onClick={handleOpenMain} tabIndex={0}>Open Main App <span className="footer-shortcut">⌘O</span></button>
            </div>
        </div>
    );
}
