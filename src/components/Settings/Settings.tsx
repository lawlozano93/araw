import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { loadPage, savePage } from '../../hooks/useStorage';
import { VaultSettings } from './VaultSettings';
import { SmartTextarea } from '../SmartTextarea';

interface SettingsProps {
    onBack: () => void;
}

type Tab = 'goals' | 'affirmations' | 'visualizations' | 'vault';
type ContentTab = Exclude<Tab, 'vault'>;

export function Settings({ onBack }: SettingsProps) {
    const [activeTab, setActiveTab] = useState<Tab>('goals');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showToast, setShowToast] = useState(false);

    useEffect(() => {
        if (activeTab !== 'vault') {
            loadContent(activeTab);
        }
    }, [activeTab]);

    const loadContent = async (type: ContentTab) => {
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
        if (activeTab === 'vault') return;
        setSaving(true);
        try {
            await savePage(activeTab, content);
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        } catch (error) {
            console.error('Failed to save content', error);
        }
        setSaving(false);
    };

    return (
        <div className="settings-container" style={{ position: 'relative' }}>
            {showToast && (
                <div className="settings-toast">
                    Settings saved successfully
                </div>
            )}
            <div className="settings-header">
                <button className="back-btn" onClick={onBack}>
                    <ArrowLeft size={16} /> Back
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
                <button
                    className={`tab-btn ${activeTab === 'vault' ? 'active' : ''}`}
                    onClick={() => setActiveTab('vault')}
                >
                    Vault
                </button>
            </div>

            <div className="settings-content">
                {activeTab === 'vault' ? (
                    <VaultSettings />
                ) : loading ? (
                    <div className="loading-spinner">Loading...</div>
                ) : (
                    <SmartTextarea
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
