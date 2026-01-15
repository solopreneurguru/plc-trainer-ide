/**
 * TypeScript declarations for Electron API
 */

import { ElectronAPI } from '../../main/preload';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
