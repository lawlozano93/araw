# ☀️ Araw

**Free, open-source, local-first daily journaling app.**

No accounts. No cloud lock-in. No subscriptions. Just you and your journal.

Araw (Filipino for "sun" / "day") helps you start each day with intention through a guided morning session:

1. 🎯 **Review Goals** — Stay aligned with what matters
2. 🧠 **Recite Affirmations** — Prime your mindset
3. 👁️ **Visualize Success** — Build motivation
4. ✍️ **Conscious Stream** — Clear your mind with freewriting
5. 💡 **Answer a Prompt** — Define your most important action

---

## Download

| Platform | Download |
|---|---|
| macOS (Apple Silicon) | [Download .dmg](https://github.com/lawlozano93/vision/releases/latest) |
| macOS (Intel) | [Download .dmg](https://github.com/lawlozano93/vision/releases/latest) |
| Windows | [Download .msi](https://github.com/lawlozano93/vision/releases/latest) |

> **macOS users:** Since the app is unsigned, you'll need to allow it in **System Settings → Privacy & Security → Open Anyway** on first launch. See [INSTALL.md](INSTALL.md) for details.

---

## Features

- **100% local** — All data stored as plain Markdown in `~/Documents/Araw`
- **Obsidian-style sync** — Point your vault to Google Drive, OneDrive, or Dropbox to sync across devices
- **Tray app** — Quick access to your inputs and today's actions from the menu bar
- **Dark mode** — Automatic light/dark theme support
- **Keyboard-first** — Navigate and complete your session without a mouse

---

## Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Backend:** Tauri v2 (Rust)
- **Storage:** Local filesystem (Markdown/JSON)
- **Icons:** [Lucide](https://lucide.dev)
- **Font:** [Amatic SC](https://fonts.google.com/specimen/Amatic+SC) (OFL)

---

## Building from Source

```bash
# Prerequisites: Node.js 18+, Rust (stable), Tauri CLI
git clone https://github.com/lawlozano93/vision.git
cd vision/frontal-lobe
npm install
npm run tauri dev    # Development
npm run tauri build  # Production
```

---

## License

MIT © [Lawrence Lozano](https://github.com/lawlozano93)
