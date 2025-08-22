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

const { app, BrowserWindow, ipcMain, clipboard, shell } = require('electron');
const path = require('path');

// Development or production mode
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

let mainWindow: any = null;

/**
 * Create the main application window
 */
function createMainWindow(): void {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 560,
    resizable: true,
    alwaysOnTop: true,           // Float above other windows
    frame: true,                 // Keep window frame for now
    webPreferences: {
      nodeIntegration: false,    // Security: disable node in renderer
      contextIsolation: true,    // Security: isolate contexts
      preload: path.join(__dirname, '../preload/preload.js'), // Load preload script
      webSecurity: !isDev,       // Allow localhost in dev
    },
  });

  // Load the React app
  if (isDev) {
    // Development: load from Vite dev server
    console.log('Loading development server...');
    mainWindow?.loadURL('http://localhost:5175')
      .then(() => {
        console.log('Development server loaded successfully');
        mainWindow?.webContents.openDevTools(); // Open DevTools in development
      })
      .catch((err: any) => {
        console.error('Failed to load development server:', err);
      });
  } else {
    // Production: load from built files
    mainWindow?.loadFile(path.join(__dirname, '../../index.html'));
  }

  // Handle window closed
  mainWindow?.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * App event handlers
 */
app.whenReady().then(() => {
  createMainWindow();
  registerIpcHandlers();
});

app.on('window-all-closed', () => {
  // On macOS, keep the app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

/**
 * Register IPC handlers for renderer communication
 */
function registerIpcHandlers(): void {
  // Open URL in default browser
  ipcMain.handle('os.openExternal', async (_event: any, url: string) => {
    try {
      if (typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))) {
        await shell.openExternal(url);
        return { success: true };
      } else {
        throw new Error('Invalid URL');
      }
    } catch (error: any) {
      console.error('Failed to open external URL:', error);
      return { success: false, error: error.message };
    }
  });

  // Read text from clipboard
  ipcMain.handle('os.readClipboard', async (_event: any) => {
    try {
      const text = clipboard.readText();
      return { success: true, text };
    } catch (error: any) {
      console.error('Failed to read clipboard:', error);
      return { success: false, error: error.message };
    }
  });

  // Window controls for minimize/expand functionality
  ipcMain.handle('window.minimize', async (_event: any) => {
    try {
      if (mainWindow) {
        mainWindow.setSize(180, 60);  // Compact widget size
        return { success: true };
      }
      return { success: false, error: 'No main window' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('window.expand', async (_event: any) => {
    try {
      if (mainWindow) {
        mainWindow.setSize(420, 560);  // Full chat size
        return { success: true };
      }
      return { success: false, error: 'No main window' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  });
}
