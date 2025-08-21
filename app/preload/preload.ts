/* preload is a bridge between electron and preload */

/**
 * PRELOAD (runs in the renderer context before UI loads)
 * - Exposes a SAFE, MINIMAL API to window.* for the React app:
 *    • window.os.openExternal(url: string): Promise<void>
 *    • window.os.readClipboard(): Promise<string>
 * - Uses contextIsolation + ipcRenderer.invoke to call main-process handlers.
 *
 * Purpose: prevent direct Node/Electron access from React components.
 * Do NOT expose more than necessary.
 */

