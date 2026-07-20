/**
 * OS.Tech - Entry Point do Processo Principal (Main Process)
 * Inicializa o Electron, conecta ao banco de dados, registra handlers IPC
 * e cria a janela principal da aplicação.
 */

import { app, BrowserWindow } from 'electron';
import path from 'path';
import { connectDatabase, disconnectDatabase } from './database/connection';
import { registerAllIpcHandlers } from './ipc';
import { EmailService } from './services/email.service';

let mainWindow: BrowserWindow | null = null;

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, '../../resources/icons/icon.png'),
    show: false,
  });

  // Carregar app conforme ambiente
  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    await mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await connectDatabase();
    registerAllIpcHandlers();
    await createWindow();
    startEmailPolling();
  } catch (error) {
    console.error('Erro ao inicializar aplicação:', error);
  }
});

const EMAIL_POLL_INTERVAL = 60 * 1000; // 60 seconds
let emailPollTimer: ReturnType<typeof setInterval> | null = null;

function startEmailPolling() {
  const emailService = new EmailService();
  const check = async () => {
    try {
      const result = await emailService.checkMail();
      if (result && result.novas > 0 && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('email:new-found', result.novas);
      }
    } catch (err) {
      console.error('[EmailPolling] Erro na verificacao automatica:', err);
    }
  };
  emailPollTimer = setInterval(check, EMAIL_POLL_INTERVAL);
}

function stopEmailPolling() {
  if (emailPollTimer) {
    clearInterval(emailPollTimer);
    emailPollTimer = null;
  }
}

app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    await disconnectDatabase();
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    await createWindow();
  }
});

app.on('before-quit', async () => {
  await disconnectDatabase();
});
