/* preload is a bridge between electron and preload */

/**
 * PRELOAD (runs in the renderer context before UI loads)
 * - Exposes a SAFE, MINIMAL API to window.* for the React app:
 *    • window.electronAPI.openExternal(url: string): Promise<void>
 *    • window.electronAPI.readClipboard(): Promise<string>
 *    • window.electronAPI.minimizeWindow(): Promise<void>
 *    • window.electronAPI.expandWindow(): Promise<void>
 * - Uses contextIsolation + ipcRenderer.invoke to call main-process handlers.
 *
 * Purpose: prevent direct Node/Electron access from React components.
 * Do NOT expose more than necessary.
 */

import { contextBridge, ipcRenderer } from 'electron';

/**
 * Expose safe API to the renderer process
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Open URL in default browser
  openExternal: async (url: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await ipcRenderer.invoke('os.openExternal', url);
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Read text from clipboard
  readClipboard: async (): Promise<{ success: boolean; text?: string; error?: string }> => {
    try {
      const result = await ipcRenderer.invoke('os.readClipboard');
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Minimize window to compact widget
  minimizeWindow: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await ipcRenderer.invoke('window.minimize');
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Expand window to full chat
  expandWindow: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await ipcRenderer.invoke('window.expand');
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Check if running in Electron
  isElectron: true,
});

// Type definitions for TypeScript
declare global {
  interface Window {
    electronAPI: {
      openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
      readClipboard: () => Promise<{ success: boolean; text?: string; error?: string }>;
      minimizeWindow: () => Promise<{ success: boolean; error?: string }>;
      expandWindow: () => Promise<{ success: boolean; error?: string }>;
      isElectron: boolean;
    };
  }
}
