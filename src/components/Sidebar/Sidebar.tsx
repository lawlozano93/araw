import './Sidebar.css';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
}

// Mock entry history - will be replaced with actual data
const mockEntries = [
    { date: '2026-02-03', preview: 'Today\'s session...' },
    { date: '2026-02-02', preview: 'Yesterday I focused on...' },
    { date: '2026-02-01', preview: 'Starting the month with...' },
];

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
    if (isCollapsed) return null;

    return (
        <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <h2>History</h2>
                <button className="collapse-btn" onClick={onToggle}>
                    ←
                </button>
            </div>
            <div className="sidebar-content">
                {mockEntries.map(entry => (
                    <div key={entry.date} className="history-item">
                        <div className="history-date">
                            {new Date(entry.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                            })}
                        </div>
                        <div className="history-preview">{entry.preview}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
