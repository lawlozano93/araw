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

### ⚠️ Installation Notes

**For macOS Users:** Since the app is unsigned, macOS will flag it as "damaged" when you download it. To fix this:
1. Move `Araw.app` from the downloaded `.dmg` into your `/Applications` folder.
2. Open the **Terminal** app.
3. Run this exact command to remove the quarantine flag:
   ```bash
   xattr -cr /Applications/Araw.app
   ```
4. You can now open the app normally!

**For Windows Users:** Since the app is unsigned, Microsoft Defender SmartScreen may display a blue "Windows protected your PC" warning.
- Click **"More info"** > **"Run anyway"** to proceed with the installation.
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

## Architecture & Development

For an in-depth look at how Araw is built, including its local-first storage design and Tauri system architecture, check out the [Architecture & Developer Guide](ARCHITECTURE.md).

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
