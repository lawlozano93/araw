# Installing Araw

## macOS

### Download
1. Go to the [latest release](https://github.com/lawlozano93/vision/releases/latest) on GitHub
2. Download the `.dmg` file for your Mac:
   - **Apple Silicon** (M1/M2/M3/M4): `Araw_x.x.x_aarch64.dmg`
   - **Intel**: `Araw_x.x.x_x64.dmg`
3. Open the `.dmg` and drag **Araw** to your Applications folder

### Bypassing Gatekeeper (Required for unsigned apps)

Since Araw is not signed with an Apple Developer certificate, macOS will block it on first launch. To fix this:

**Option A — System Settings (recommended):**
1. Try opening Araw (it will be blocked)
2. Go to **System Settings → Privacy & Security**
3. Scroll down and click **"Open Anyway"** next to the Araw message
4. Click **Open** in the confirmation dialog

**Option B — Terminal:**
```bash
sudo xattr -cr /Applications/Araw.app
```

This only needs to be done once. After that, Araw will open normally.

---

## Windows

1. Download `Araw_x.x.x_x64-setup.exe` from the [latest release](https://github.com/lawlozano93/vision/releases/latest)
2. Run the installer
3. If Windows SmartScreen appears, click **"More info"** → **"Run anyway"**

---

## Building from Source

### Prerequisites
- [Node.js](https://nodejs.org/) v18+
- [Rust](https://rustup.rs/) (latest stable)
- [Tauri CLI](https://tauri.app/start/): `cargo install tauri-cli`

### Steps
```bash
git clone https://github.com/lawlozano93/vision.git
cd vision/frontal-lobe
npm install
npm run tauri dev    # Development mode
npm run tauri build  # Production build
```

The built app will be in `src-tauri/target/release/bundle/`.
