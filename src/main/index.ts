/**
 * Electron Main Process
 */

import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import { RuntimeManager, WatchData } from './RuntimeManager';
import { LADProgram, validateLADProgram } from '../core/lad/types';

let mainWindow: BrowserWindow | null = null;
let runtimeManager: RuntimeManager | null = null;
let currentLADProgram: LADProgram | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1280,
    minHeight: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'PLC Trainer IDE - Demo',
  });

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
    if (runtimeManager) {
      runtimeManager.stop();
      runtimeManager = null;
    }
  });
}

/**
 * Initialize runtime manager with a default LAD program
 */
function initializeRuntime() {
  runtimeManager = new RuntimeManager();

  // Set up watch callback to send updates to renderer
  runtimeManager.setWatchCallback((watchData: WatchData) => {
    if (mainWindow) {
      mainWindow.webContents.send('runtime:watch-update', watchData);
    }
  });

  // Load default LAD program (seal-in start/stop)
  try {
    // Try multiple paths for dev vs production
    const possiblePaths = [
      path.join(__dirname, '../core/lad/fixtures/04-seal-in-start-stop.lad.json'),
      path.join(process.cwd(), 'src/core/lad/fixtures/04-seal-in-start-stop.lad.json'),
      path.join(app.getAppPath(), 'src/core/lad/fixtures/04-seal-in-start-stop.lad.json'),
    ];

    let fixturePath = '';
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        fixturePath = p;
        break;
      }
    }

    if (fixturePath) {
      const json = fs.readFileSync(fixturePath, 'utf-8');
      currentLADProgram = validateLADProgram(JSON.parse(json));
      runtimeManager.loadLADProgram(currentLADProgram);
      console.log('Loaded LAD program from:', fixturePath);
    } else {
      throw new Error('Could not find fixture file');
    }
  } catch (error) {
    console.error('Failed to load default LAD program:', error);
    // Create minimal default program
    currentLADProgram = {
      version: '1.0',
      networks: [],
    };
  }
}

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  initializeRuntime();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      initializeRuntime();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// ============================================================================
// IPC Handlers
// ============================================================================

/**
 * Start the PLC runtime
 */
ipcMain.handle('runtime:start', (_event, scanTimeMs: number = 100) => {
  if (!runtimeManager) {
    initializeRuntime();
  }

  runtimeManager!.start(scanTimeMs);
  return { status: 'running' };
});

/**
 * Stop the PLC runtime
 */
ipcMain.handle('runtime:stop', () => {
  if (runtimeManager) {
    runtimeManager.stop();
  }
  return { status: 'stopped' };
});

/**
 * Execute one scan step
 */
ipcMain.handle('runtime:step', () => {
  if (!runtimeManager) {
    initializeRuntime();
  }

  runtimeManager!.step();
  return { status: 'stepped' };
});

/**
 * Reset the runtime
 */
ipcMain.handle('runtime:reset', () => {
  if (runtimeManager) {
    runtimeManager.reset();
  }
  return { status: 'reset' };
});

/**
 * Set an input value
 */
ipcMain.handle('runtime:set-input', (_event, { address, value }: { address: string; value: boolean }) => {
  if (!runtimeManager) {
    initializeRuntime();
  }

  // Convert address to tag name (e.g., "%I0.0" → "input_0")
  const match = address.match(/%I0\.(\d+)/);
  if (match) {
    const index = parseInt(match[1], 10);
    runtimeManager!.setTagValue(`input_${index}`, value);

    // Also set fixture tag names for common inputs
    if (index === 0) {
      runtimeManager!.setTagValue('start_button', value);
    } else if (index === 1) {
      runtimeManager!.setTagValue('stop_button', value);
    }
  } else {
    // Direct tag name
    runtimeManager!.setTagValue(address, value);
  }

  return { success: true };
});

/**
 * Get runtime status
 */
ipcMain.handle('runtime:get-status', () => {
  if (!runtimeManager) {
    return { status: 'stopped' };
  }
  return { status: runtimeManager.getStatus() };
});

/**
 * Update the ladder program
 */
ipcMain.handle('ladder:update-program', (_event, ladProgram: LADProgram) => {
  currentLADProgram = ladProgram;

  // Reload in runtime if it exists
  if (runtimeManager) {
    runtimeManager.loadLADProgram(ladProgram);
  }

  return { success: true };
});

/**
 * Get the current ladder program
 */
ipcMain.handle('ladder:get-program', () => {
  return currentLADProgram || { version: '1.0', networks: [] };
});
