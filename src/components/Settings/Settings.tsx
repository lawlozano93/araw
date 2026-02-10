import { useState, useEffect } from 'react';
import { loadPage, savePage } from '../../hooks/useStorage';

interface SettingsProps {
    onBack: () => void;
}

type Tab = 'goals' | 'affirmations' | 'visualizations';

export function Settings({ onBack }: SettingsProps) {
    const [activeTab, setActiveTab] = useState<Tab>('goals');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadContent(activeTab);
    }, [activeTab]);

    const loadContent = async (type: Tab) => {
        setLoading(true);
        try {
            const data = await loadPage(type);
            setContent(data);
        } catch (error) {
            console.error('Failed to load content', error);
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await savePage(activeTab, content);
            // Optional: Show success toast
        } catch (error) {
            console.error('Failed to save content', error);
        }
        setSaving(false);
    };

    return (
        <div className="settings-container">
            <div className="settings-header">
                <button className="back-btn" onClick={onBack}>
                    ← Back
                </button>
                <h2>Settings</h2>
                <div style={{ width: '60px' }}></div> {/* Spacer for alignment */}
            </div>

            <div className="settings-tabs">
                <button
                    className={`tab-btn ${activeTab === 'goals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('goals')}
                >
                    Goals
                </button>
                <button
                    className={`tab-btn ${activeTab === 'affirmations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('affirmations')}
                >
                    Affirmations
                </button>
                <button
                    className={`tab-btn ${activeTab === 'visualizations' ? 'active' : ''}`}
                    onClick={() => setActiveTab('visualizations')}
                >
                    Visualization
                </button>
            </div>

            <div className="settings-content">
                {loading ? (
                    <div className="loading-spinner">Loading...</div>
                ) : (
                    <textarea
                        className="settings-textarea"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder={`Enter your ${activeTab} here...`}
                    />
                )}
            </div>

            <div className="settings-footer">
                <button
                    className="save-btn"
                    onClick={handleSave}
                    disabled={saving || loading}
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}
