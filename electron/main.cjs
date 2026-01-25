const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

const { startLocalStaticServer, DEFAULT_PORT } = require('./localServer.cjs');

let localStaticServer = null;

// IPC minimal para abrir URLs no browser padrão do SO (ex.: Stripe checkout/portal).
ipcMain.handle('siscqt:openExternal', async (_event, url) => {
  try {
    if (typeof url !== 'string') return false;
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) return false;
    await shell.openExternal(trimmed);
    return true;
  } catch {
    return false;
  }
});

function resolveStartUrl() {
  const devUrl = process.env.ELECTRON_DEV_URL;
  if (devUrl) return devUrl;

  const forceLocalhost = process.env.ELECTRON_FORCE_LOCALHOST === '1';
  if (app.isPackaged || forceLocalhost) {
    // No modo empacotado, servimos a UI via servidor local estático (SPA) em localhost.
    // Isso é importante para fluxos OAuth (redirect URI HTTP previsível).
    const port = Number(process.env.ELECTRON_STATIC_PORT || DEFAULT_PORT);
    return `http://localhost:${port}`;
  }

  // Modo local (sem Vite): fallback para arquivo gerado pelo Vite.
  const indexPath = path.join(app.getAppPath(), 'dist', 'client', 'index.html');
  return pathToFileURL(indexPath).toString();
}

async function ensureLocalStaticServer() {
  const forceLocalhost = process.env.ELECTRON_FORCE_LOCALHOST === '1';
  if (!app.isPackaged && !forceLocalhost) return;
  if (localStaticServer) return;

  const rootDir = path.join(app.getAppPath(), 'dist', 'client');
  const port = Number(process.env.ELECTRON_STATIC_PORT || DEFAULT_PORT);

  try {
    localStaticServer = startLocalStaticServer({
      rootDir,
      host: 'localhost',
      port,
    });
    await localStaticServer.ready;
  } catch (err) {
    const code = err && typeof err === 'object' ? err.code : undefined;
    const msg =
      code === 'EADDRINUSE'
        ? `A porta ${port} já está em uso. Feche o app/processo que está usando essa porta e tente novamente.`
        : `Falha ao iniciar o servidor local da UI.\n\n${String(err?.message || err)}`;
    try {
      dialog.showErrorBox('sisCQT Desktop', msg);
    } finally {
      app.quit();
    }
  }
}

async function createWindow() {
  await ensureLocalStaticServer();

  const win = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  const startUrl = resolveStartUrl();
  win.loadURL(startUrl);

  if (process.env.NODE_ENV !== 'production') {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (localStaticServer) {
    // best-effort: não bloqueia o quit
    localStaticServer.close().catch(() => {});
    localStaticServer = null;
  }
});
