import React, { useRef } from 'react';

interface SmartTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    value: string;
    onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

/**
 * SmartTextarea — a drop-in <textarea> replacement with markdown shortcuts:
 *
 * Formatting:
 *   Cmd/Ctrl + B  → **bold**
 *   Cmd/Ctrl + I  → *italic*
 *   Cmd/Ctrl + U  → __underline__ (non-standard md but common)
 *   Cmd/Ctrl + Shift + X  → ~~strikethrough~~
 *
 * Lists:
 *   Enter after "- item"   → new bullet
 *   Enter after "1. item"  → auto-increment numbered list
 *   Enter on empty list item → break out of list
 *
 * Indentation:
 *   Tab        → indent (4 spaces)
 *   Shift+Tab  → outdent (remove 4 spaces)
 */
export function SmartTextarea({ value, onChange, ...props }: SmartTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const fireChange = (newValue: string) => {
        const event = { target: { value: newValue } } as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(event);
    };

    const setCursor = (pos: number) => {
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.selectionStart = textareaRef.current.selectionEnd = pos;
            }
        }, 0);
    };

    const wrapSelection = (prefix: string, suffix: string) => {
        const el = textareaRef.current;
        if (!el) return;
        const { selectionStart, selectionEnd, value: text } = el;
        const selected = text.substring(selectionStart, selectionEnd);

        // If already wrapped, unwrap
        const before = text.substring(0, selectionStart);
        const after = text.substring(selectionEnd);
        if (before.endsWith(prefix) && after.startsWith(suffix)) {
            const newValue = before.slice(0, -prefix.length) + selected + after.slice(suffix.length);
            fireChange(newValue);
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.selectionStart = selectionStart - prefix.length;
                    textareaRef.current.selectionEnd = selectionEnd - prefix.length;
                }
            }, 0);
            return;
        }

        // Wrap
        const newValue = before + prefix + selected + suffix + after;
        fireChange(newValue);
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.selectionStart = selectionStart + prefix.length;
                textareaRef.current.selectionEnd = selectionEnd + prefix.length;
            }
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const target = e.target as HTMLTextAreaElement;
        const { selectionStart, selectionEnd, value: text } = target;
        const isMod = e.metaKey || e.ctrlKey;

        // ── Formatting shortcuts ──
        if (isMod && !e.shiftKey) {
            if (e.key === 'b') { e.preventDefault(); wrapSelection('**', '**'); return; }
            if (e.key === 'i') { e.preventDefault(); wrapSelection('*', '*'); return; }
            if (e.key === 'u') { e.preventDefault(); wrapSelection('__', '__'); return; }
        }
        if (isMod && e.shiftKey && (e.key === 'x' || e.key === 'X')) {
            e.preventDefault(); wrapSelection('~~', '~~'); return;
        }

        // ── Tab indentation ──
        if (e.key === 'Tab') {
            e.preventDefault();
            const lineStart = text.lastIndexOf('\n', selectionStart - 1) + 1;

            if (e.shiftKey) {
                const line = text.substring(lineStart, selectionStart);
                if (line.startsWith('    ')) {
                    fireChange(text.substring(0, lineStart) + text.substring(lineStart + 4));
                    setCursor(Math.max(lineStart, selectionStart - 4));
                }
            } else {
                fireChange(text.substring(0, selectionStart) + '    ' + text.substring(selectionEnd));
                setCursor(selectionStart + 4);
            }
            return;
        }

        // ── List continuation on Enter ──
        if (e.key === 'Enter') {
            const lineStart = text.lastIndexOf('\n', selectionStart - 1) + 1;
            const currentLine = text.substring(lineStart, selectionStart);

            const bulletMatch = currentLine.match(/^(\s*)([-*])\s+/);
            const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s+/);

            if (bulletMatch || numberMatch) {
                e.preventDefault();

                if (bulletMatch) {
                    const isEmpty = currentLine.trim() === bulletMatch[2];
                    if (isEmpty) {
                        fireChange(text.substring(0, lineStart) + '\n' + text.substring(selectionEnd));
                        setCursor(lineStart + 1);
                        return;
                    }
                    const insert = '\n' + bulletMatch[1] + bulletMatch[2] + ' ';
                    fireChange(text.substring(0, selectionStart) + insert + text.substring(selectionEnd));
                    setCursor(selectionStart + insert.length);
                } else if (numberMatch) {
                    const isEmpty = currentLine.trim() === numberMatch[2] + '.';
                    if (isEmpty) {
                        fireChange(text.substring(0, lineStart) + '\n' + text.substring(selectionEnd));
                        setCursor(lineStart + 1);
                        return;
                    }
                    const next = parseInt(numberMatch[2], 10) + 1;
                    const insert = '\n' + numberMatch[1] + next + '. ';
                    fireChange(text.substring(0, selectionStart) + insert + text.substring(selectionEnd));
                    setCursor(selectionStart + insert.length);
                }
            }
        }
    };

    return (
        <textarea
            ref={textareaRef}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            {...props}
        />
    );
}
