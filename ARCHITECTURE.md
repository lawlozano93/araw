# Architecture & Developer Guide

Welcome to the **Araw** codebase! This document serves as a Product Requirements Document (PRD) and Technical Architecture overview to help developers, contributors, and those forking the repo understand how the app is built and how data flows through it.

## 1. Product Overview & Philosophy

**Araw** (Filipino for "sun" / "day") is a local-first, privacy-focused daily journaling application. 
The core philosophy of the app is **simplicity and ownership**:
- **No Cloud, No Accounts:** All data is stored directly on the user's hard drive.
- **Local-First Sync:** Users can point the app's "Vault" to a cloud-synced folder (like Google Drive, iCloud, or Dropbox) to achieve cross-device syncing without relying on a centralized database.
- **Guided Routine:** The app enforces a structured morning session (Goals → Affirmations → Visualizations → Stream of Consciousness → Daily Prompt) rather than an empty text box.

## 2. Tech Stack

The app is built using the **Tauri v2** framework, which allows us to build a tiny, secure, and blazing-fast native desktop app using web technologies.

- **Frontend:** React 19, TypeScript, and Vite.
- **Backend / Host:** Rust (Tauri).
- **Styling:** Vanilla CSS (No heavy CSS frameworks to keep the bundle size small).
- **Icons:** Lucide React.
- **Storage:** Plaintext Markdown and JSON files.

## 3. High-Level Architecture

The application is split into two main pieces that communicate via Tauri's inter-process communication (IPC) bridge:

```mermaid
graph TD;
    subgraph Frontend [React Frontend (Webview)]
        App[App.tsx / Router]
        Wizard[Daily Wizard Workflow]
        Dash[Dashboard]
        Tray[Tray App View]
        Hooks[Hooks / Storage Handlers]
    end

    subgraph Backend [Rust Backend (Tauri Core)]
        TauriSetup[Tauri Builder / setup]
        IPC[IPC Command Handlers]
        StorageOS[OS File System / storage.rs]
        Menu[System Tray / Window Manager]
    end

    App --> Hooks
    Wizard --> Hooks
    Dash --> Hooks
    Tray --> Hooks
    Hooks -- "invoke('read_file', 'write_file')" --> IPC
    IPC --> StorageOS
    TauriSetup --> Menu
```

### 3.1. The Frontend (`src/`)

The React application acts as the presentation and state management layer.
- **`App.tsx`**: The main entry point. It handles routing between different views (`dashboard`, `wizard`, `entry`, `settings`). It also determines if the current window is the `main` window or the `tray` window.
- **`components/Wizard/`**: The core feature of the app. A multi-step form that guides the user through the daily morning routine.
- **`components/TrayApp/`**: A miniaturized React application rendered in a separate, hidden Tauri window that acts as a macOS menu bar or Windows tray popover.
- **`hooks/useStorage.ts`**: The bridge between React and Rust. Instead of using `localStorage` or `IndexedDB`, these hooks abstract the Tauri `invoke` calls to read/write JSON and Markdown files directly to the OS.

### 3.2. The Backend (`src-tauri/`)

The Rust backend is intentionally lightweight. Its primarily responsible for native OS capabilities that the browser cannot do:
- **`main.rs` & `lib.rs`**: The Tauri app initialization. This sets up the System Tray, context menus, and registers the IPC commands.
- **`storage.rs`**: Custom file management functions exposed to the frontend as commands (`read_file`, `write_file`, `list_files`, `delete_file`, `get_vault_path`). All data is saved relative to the user's selected "Vault" directory.

## 4. Data Storage & The "Vault"

Because Araw is local-first, there is no SQL or NoSQL database. 

1. **Vault Location**: By default, the app initializes a vault in the user's `~/Documents/Araw` folder. The user can change this via Settings using a native folder picker.
2. **File Structure**:
    - `/pages`: Stores `goals.md`, `affirmations.md`, and `visualizations.md`.
    - `/journals`: Stores the daily reflections in YYYY-MM-DD Markdown format (e.g., `2024-03-12.md`).
    - `/config`: Stores app-wide configurations like `actions.json` (daily to-do tracking) and `session.json` (tracking progress of today's morning routine).

Because the data is stored in standard Markdown and JSON, the user has full ownership of their data and can easily read their journals in any text editor (like Obsidian or VS Code).

## 5. Multi-Window Management

Araw utilizes Tauri's multi-window capabilities:
1. **Main Window (`main`)**: The primary application interface. Can be minimized, maximized, and closed.
2. **Tray Window (`tray`)**: A borderless, transparent window that runs in the background. When the user clicks the menu bar icon, Rust calculates the cursor's physical coordinates and moves the `tray` WebviewWindow to that location and shows it. 
   - *Note: Inside `App.tsx`, we use `getCurrentWindow().label` to detect if the React component should render the full `<App />` or the `<TrayApp />`.*

## 6. Contributing & Running Locally

To start developing:

1. Follow the [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites) to install Rust.
2. Clone the repository and install Node dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run tauri dev
   ```

**Formatting and Code Style:**
- Prefer keeping CSS vanilla and localized to component folders (e.g., `Dashboard.tsx` alongside `Dashboard.css`).
- Use Lucide React for consistent iconography.
- Defer heavy operations to Rust if possible, but keep business logic in React to maintain a fast iteration speed.
