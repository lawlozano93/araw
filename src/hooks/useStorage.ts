import { invoke } from '@tauri-apps/api/core';
import type { JournalEntry, ActionItem, Prompt, AppConfig, DailySession } from '../types/models';

// Helper to get today's date in YYYY-MM-DD format (local time, not UTC).
export const getToday = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function parseYYYYMMDDLocal(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
}

// File paths
const PATHS = {
    config: 'config.json',
    prompts: 'prompts.json',
    goals: 'pages/goals.md',
    affirmations: 'pages/affirmations.md',
    visualizations: 'pages/visualizations.md',
    entry: (date: string) => `entries/${date}.md`,
};

// ============ Low-level file operations ============

export async function readFile(path: string): Promise<string> {
    return invoke<string>('read_file', { path });
}

export async function writeFile(path: string, content: string): Promise<void> {
    return invoke('write_file', { path, content });
}

export async function listFiles(dir: string): Promise<string[]> {
    return invoke<string[]>('list_files', { dir });
}

export async function deleteFile(path: string): Promise<void> {
    return invoke('delete_file', { path });
}

export async function getDataPath(): Promise<string> {
    return invoke<string>('get_data_path');
}

// ============ Config ============

export async function loadConfig(): Promise<AppConfig> {
    const content = await readFile(PATHS.config);
    if (!content) {
        const defaultConfig: AppConfig = {
            theme: 'light',
            currentStreak: 0,
            lastSessionDate: '',
            sessions: {},
            onboardingComplete: false,
        };
        await saveConfig(defaultConfig);
        return defaultConfig;
    }
    return JSON.parse(content);
}

export async function saveConfig(config: AppConfig): Promise<void> {
    await writeFile(PATHS.config, JSON.stringify(config, null, 2));
}

// ============ Session ============

export async function loadSession(date: string): Promise<DailySession | null> {
    const config = await loadConfig();
    const sessions = (config as any).sessions || {};
    return sessions[date] || null;
}

export async function saveSession(session: DailySession): Promise<void> {
    const config = await loadConfig();
    const sessions = (config as any).sessions || {};
    sessions[session.date] = session;
    await saveConfig({ ...config, sessions } as any);
}

// ============ Pages (Goals, Affirmations, Visualizations) ============

export async function loadPage(type: 'goals' | 'affirmations' | 'visualizations'): Promise<string> {
    const path = PATHS[type];
    const content = await readFile(path);

    if (!content) {
        // Return default content (plain text, no markdown headers)
        const defaults: Record<string, string> = {
            goals: 'Build meaningful products\nDevelop consistent habits\nLive intentionally',
            affirmations: 'I am capable of achieving my goals\nI choose to focus on what matters\nI am becoming better every day',
            visualizations: 'Imagine yourself one year from now, having achieved your goals...',
        };
        await savePage(type, defaults[type]);
        return defaults[type];
    }

    // Strip legacy markdown headers (e.g. "# My Goals\n\n") if present
    return content.replace(/^#+ .+\n+/, '').trim();
}

export async function savePage(type: 'goals' | 'affirmations' | 'visualizations', content: string): Promise<void> {
    await writeFile(PATHS[type], content);
}

// ============ Prompts ============

const DEFAULT_PROMPTS: Prompt[] = [
    { id: '1', text: 'What is the single most important thing I need to accomplish today?', tags: ['focus'], isFavorite: true },
    { id: '2', text: 'What am I grateful for right now?', tags: ['gratitude'], isFavorite: false },
    { id: '3', text: 'What would make today great?', tags: ['intention'], isFavorite: false },
    { id: '4', text: 'What is one thing I can do today to move closer to my goals?', tags: ['goals'], isFavorite: true },
    { id: '5', text: 'What lesson did I learn yesterday that I can apply today?', tags: ['reflection'], isFavorite: false },
];

export async function loadPrompts(): Promise<Prompt[]> {
    const content = await readFile(PATHS.prompts);
    if (!content) {
        await savePrompts(DEFAULT_PROMPTS);
        return DEFAULT_PROMPTS;
    }
    return JSON.parse(content);
}

export async function savePrompts(prompts: Prompt[]): Promise<void> {
    await writeFile(PATHS.prompts, JSON.stringify(prompts, null, 2));
}

// ============ Journal Entries ============

export async function loadEntry(date: string): Promise<JournalEntry | null> {
    const content = await readFile(PATHS.entry(date));
    if (!content) return null;
    return parseEntryMarkdown(content, date);
}

export async function saveEntry(entry: JournalEntry): Promise<void> {
    const markdown = formatEntryMarkdown(entry);
    await writeFile(PATHS.entry(entry.date), markdown);
}

export async function listEntries(): Promise<string[]> {
    const files = await listFiles('entries');
    return files
        .filter(f => f.endsWith('.md'))
        .map(f => f.replace('.md', ''));
}

// ============ Markdown Parsing ============

function parseEntryMarkdown(content: string, date: string): JournalEntry {
    const DRAFT_MARKER_REGEX = /<!--\s*ARAW_DRAFT\s+step=(\d+)\s*-->/;
    const markerMatch = content.match(DRAFT_MARKER_REGEX);
    const inProgress = !!markerMatch;
    const draftStep = markerMatch ? Number(markerMatch[1]) : undefined;

    const sections = content.split(/^## /m);

    let streamText = '';
    let promptText = '';
    let answerText = '';
    const actions: ActionItem[] = [];

    for (const section of sections) {
        if (section.startsWith('Conscious Stream')) {
            streamText = section.replace('Conscious Stream\n', '').trim();
        } else if (section.startsWith('Prompt')) {
            const lines = section.split('\n');
            promptText = lines[1]?.replace(/^\*\*(.+)\*\*$/, '$1') || '';
            answerText = lines.slice(2).join('\n').trim();
        } else if (section.startsWith('Actions')) {
            const lines = section.split('\n').slice(1);
            for (const line of lines) {
                const match = line.match(/^- \[([ x])\] (.+?)( <!-- MAIN -->)?\s*$/);
                if (match) {
                    actions.push({
                        id: crypto.randomUUID(),
                        text: match[2],
                        done: match[1] === 'x',
                        isMain: !!match[3],
                        createdAt: date,
                    });
                }
            }
        }
    }

    return {
        id: date,
        date,
        streamText,
        promptText,
        answerText,
        actions,
        inProgress,
        draftStep,
    };
}

function formatEntryMarkdown(entry: JournalEntry): string {
    const draftStep = entry.draftStep;
    const shouldMarkDraft = entry.inProgress || typeof draftStep === 'number';

    const dateFormatted = parseYYYYMMDDLocal(entry.date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    let md = `# ${dateFormatted}\n\n`;

    if (shouldMarkDraft) {
        md += `<!-- ARAW_DRAFT step=${draftStep ?? 5} -->\n\n`;
    }

    if (entry.streamText) {
        md += `## Conscious Stream\n${entry.streamText}\n\n`;
    }

    if (entry.promptText || entry.answerText) {
        md += `## Prompt\n**${entry.promptText}**\n\n${entry.answerText}\n\n`;
    }

    if (entry.actions.length > 0) {
        md += `## Actions\n`;
        for (const action of entry.actions) {
            const mainMarker = action.isMain ? ' <!-- MAIN -->' : '';
            md += `- [${action.done ? 'x' : ' '}] ${action.text}${mainMarker}\n`;
        }
    }

    return md;
}
