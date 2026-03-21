import { useState, useEffect } from 'react';
import { FolderOpen, ExternalLink } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { openPath } from '@tauri-apps/plugin-opener';
import { open } from '@tauri-apps/plugin-dialog';
import { loadConfig, saveConfig } from '../../hooks/useStorage';
import { useSound } from '../../hooks/useSound';

const isWindows = navigator.userAgent.toLowerCase().includes('windows');
const explorerLabel = isWindows ? 'Open in Explorer' : 'Open in Finder';

export function VaultSettings() {
    const [vaultPath, setVaultPath] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<string>('');
    const playSound = useSound();

    useEffect(() => {
        loadVaultPath();
    }, []);

    const loadVaultPath = async () => {
        try {
            const path = await invoke<string>('get_vault_path');
            setVaultPath(path);
        } catch (e) {
            console.error('Failed to load vault path', e);
        }
        setLoading(false);
    };

    const handleChangeLocation = async () => {
        playSound();
        try {
            const selectedPath = await open({
                directory: true,
                multiple: false,
                title: 'Select Vault Location'
            });

            if (selectedPath && typeof selectedPath === 'string') {
                setStatus('Moving vault...');
                await invoke('set_vault_path', { path: selectedPath });
                const config = await loadConfig();
                await saveConfig({ ...config, vaultPath: selectedPath });
                setVaultPath(selectedPath);
                setStatus('Vault moved successfully!');
                setTimeout(() => setStatus(''), 3000);
            }
        } catch (e) {
            setStatus(`Error: ${e}`);
        }
    };

    const handleResetData = async () => {
        playSound();
        const confirmed = window.confirm(
            "Are you sure you want to completely delete all app data, including all journal entries and settings? This action cannot be undone."
        );

        if (confirmed) {
            try {
                setStatus('Deleting data...');
                await invoke('reset_data');
                setStatus('Data has been reset. Please restart the app.');
                // We show this indefinitely since the app is effectively wiped.
            } catch (e) {
                setStatus(`Error: ${e}`);
            }
        }
    };

    const handleOpenInExplorer = async () => {
        playSound();
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
                <div className="vault-path">{vaultPath}</div>
            </div>

            <div className="vault-info">
                Point your vault to a cloud-synced folder (Google Drive, OneDrive, Dropbox)
                to sync your entries across devices. Your data is stored as plain Markdown files.
            </div>

            <div className="vault-actions">
                <button type="button" className="vault-btn" onClick={handleChangeLocation}>
                    <FolderOpen size={14} aria-hidden />
                    Change Vault Location
                </button>

                <button type="button" className="vault-btn" onClick={handleOpenInExplorer}>
                    <ExternalLink size={14} aria-hidden />
                    {explorerLabel}
                </button>
            </div>

            <div className="vault-danger-zone">
                <div className="vault-label vault-danger-label">Danger Zone</div>
                <div className="vault-info vault-danger-copy">
                    Resetting data will completely delete all journal entries, settings, and habits.
                </div>
                <button type="button" className="vault-btn vault-btn--danger" onClick={handleResetData}>
                    Reset App Data
                </button>
            </div>

            {status && (
                <div className={`vault-status ${status.startsWith('Error') ? 'error' : 'success'}`}>
                    {status}
                </div>
            )}
        </div>
    );
}
