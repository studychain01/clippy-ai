/**
 * Electron MAIN PROCESS
 * - Creates the BrowserWindow (floating, resizable)
 * - Loads the React app (dev: Vite URL, prod: index.html)
 * - Registers IPC handlers for OS capabilities:
 *    • 'os.openExternal' -> open default browser with a URL
 *    • 'os.readClipboard' -> read text from the OS clipboard
 * - (Optional) Sets tray menu, global shortcuts, always-on-top, etc.
 *
 * This process has Node/Electron privileges. No UI here.
 * Security: keep API surface minimal and validate inputs in handlers.
 */

