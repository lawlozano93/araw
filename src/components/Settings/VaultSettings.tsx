import { useState, useEffect } from 'react';
import { FolderOpen, ExternalLink, RefreshCw } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { openPath } from '@tauri-apps/plugin-opener';
import { loadConfig, saveConfig } from '../../hooks/useStorage';

const isWindows = navigator.userAgent.toLowerCase().includes('windows');
const explorerLabel = isWindows ? 'Open in Explorer' : 'Open in Finder';

export function VaultSettings() {
    const [vaultPath, setVaultPath] = useState<string>('');
    const [editPath, setEditPath] = useState<string>('');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<string>('');

    useEffect(() => {
        loadVaultPath();
    }, []);

    const loadVaultPath = async () => {
        try {
            const path = await invoke<string>('get_vault_path');
            setVaultPath(path);
            setEditPath(path);
        } catch (e) {
            console.error('Failed to load vault path', e);
        }
        setLoading(false);
    };

    const handleStartEdit = () => {
        setEditPath(vaultPath);
        setIsEditing(true);
    };

    const handleSaveVault = async () => {
        if (!editPath || editPath === vaultPath) {
            setIsEditing(false);
            return;
        }
        try {
            setStatus('Moving vault...');
            await invoke('set_vault_path', { path: editPath });
            const config = await loadConfig();
            await saveConfig({ ...config, vaultPath: editPath });
            setVaultPath(editPath);
            setIsEditing(false);
            setStatus('Vault moved successfully!');
            setTimeout(() => setStatus(''), 3000);
        } catch (e) {
            setStatus(`Error: ${e}`);
        }
    };

    const handleCancelEdit = () => {
        setEditPath(vaultPath);
        setIsEditing(false);
    };

    const handleOpenInExplorer = async () => {
        try {
            await openPath(vaultPath);
        } catch (e) {
            setStatus(`Error opening folder: ${e}`);
        }
    };

    if (loading) {
        return <div className="vault-settings">Loading...</div>;
    }

    return (
        <div className="vault-settings">
            <div className="vault-current">
                <div className="vault-label">Vault Location</div>
                {isEditing ? (
                    <div className="vault-edit-row">
                        <input
                            type="text"
                            className="vault-path-input"
                            value={editPath}
                            onChange={(e) => setEditPath(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveVault();
                                if (e.key === 'Escape') handleCancelEdit();
                            }}
                            autoFocus
                        />
                        <button className="vault-btn vault-btn--primary" onClick={handleSaveVault}>
                            <RefreshCw size={14} /> Update
                        </button>
                    </div>
                ) : (
                    <div className="vault-path">{vaultPath}</div>
                )}
            </div>

            <div className="vault-info">
                Point your vault to a cloud-synced folder (Google Drive, OneDrive, Dropbox)
                to sync your entries across devices. Your data is stored as plain Markdown files.
            </div>

            {!isEditing && (
                <div className="vault-actions">
                    <button className="vault-btn" onClick={handleStartEdit}>
                        <FolderOpen size={14} />
                        Change Vault Location
                    </button>

                    <button className="vault-btn" onClick={handleOpenInExplorer}>
                        <ExternalLink size={14} />
                        {explorerLabel}
                    </button>
                </div>
            )}

            {status && (
                <div className={`vault-status ${status.startsWith('Error') ? 'error' : 'success'}`}>
                    {status}
                </div>
            )}
        </div>
    );
}
