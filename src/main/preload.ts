/**
 * Preload script: Exposes safe IPC API to renderer
 */

import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface
export interface ElectronAPI {
  runtime: {
    start: (scanTimeMs?: number) => Promise<{ status: string }>;
    stop: () => Promise<{ status: string }>;
    step: () => Promise<{ status: string }>;
    reset: () => Promise<{ status: string }>;
    setInput: (address: string, value: boolean) => Promise<{ success: boolean }>;
    getStatus: () => Promise<{ status: string }>;
    onWatchUpdate: (callback: (data: any) => void) => void;
    removeWatchListener: () => void;
  };
  ladder: {
    updateProgram: (ladderProgram: any) => Promise<{ success: boolean }>;
    getProgram: () => Promise<any>;
  };
}

// Expose protected methods to renderer
contextBridge.exposeInMainWorld('electronAPI', {
  runtime: {
    start: (scanTimeMs?: number) => ipcRenderer.invoke('runtime:start', scanTimeMs),
    stop: () => ipcRenderer.invoke('runtime:stop'),
    step: () => ipcRenderer.invoke('runtime:step'),
    reset: () => ipcRenderer.invoke('runtime:reset'),
    setInput: (address: string, value: boolean) =>
      ipcRenderer.invoke('runtime:set-input', { address, value }),
    getStatus: () => ipcRenderer.invoke('runtime:get-status'),
    onWatchUpdate: (callback: (data: any) => void) => {
      ipcRenderer.on('runtime:watch-update', (_event, data) => callback(data));
    },
    removeWatchListener: () => {
      ipcRenderer.removeAllListeners('runtime:watch-update');
    },
  },
  ladder: {
    updateProgram: (ladderProgram: any) => ipcRenderer.invoke('ladder:update-program', ladderProgram),
    getProgram: () => ipcRenderer.invoke('ladder:get-program'),
  },
} as ElectronAPI);
