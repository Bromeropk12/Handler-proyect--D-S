const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron');
const path = require('path');
const log = require('electron-log');

// Forzar tema claro para Windows 11
nativeTheme.themeSource = 'light';

// Configurar logging
log.transports.file.level = 'info';
log.transports.file.resolvePathFn = () => path.join(app.getPath('userData'), 'logs', 'main.log');

log.info('Aplicación iniciada');

// Mantener referencia global de la ventana
let mainWindow;

function createWindow() {
  log.info('Creando ventana principal');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    // Ventana redimensionable
    resizable: true,
    // Ocultar barra de título estándar y usar overlay de Windows
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#ffffff',
      symbolColor: '#333333',
      height: 32
    },
    // Permitir redimensionar desde los bordes
    thickFrame: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'public', 'icon.png'),
    show: false
  });

  // Cargar la app
  // Forzar modo desarrollo para desarrollo local
  const isDev = !app.isPackaged;
  
  console.log('Is packaged:', app.isPackaged);
  console.log('Is dev:', isDev);
  
  if (isDev) {
    log.info('Modo desarrollo - cargando desde localhost:3000');
    mainWindow.loadURL('http://localhost:3000').catch(err => {
      log.error('Error al cargar URL:', err);
      // Si falla, intentar cargar desde archivo build
      mainWindow.loadFile(path.join(__dirname, '..', 'build', 'index.html'));
    });
    mainWindow.webContents.openDevTools();
  } else {
    log.info('Modo producción - cargando archivo build');
    mainWindow.loadFile(path.join(__dirname, '..', 'build', 'index.html'));
  }

  // Mostrar cuando esté lista
  mainWindow.once('ready-to-show', () => {
    log.info('Ventana lista para mostrar');
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Manejar errores de carga
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log.error(`Error al cargar: ${errorCode} - ${errorDescription}`);
  });
}

// Eventos de la app
app.whenReady().then(() => {
  log.info('App lista');
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log.info('Todas las ventanas cerradas');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers para comunicación entre renderer y main
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-user-data-path', () => {
  return app.getPath('userData');
});

ipcMain.handle('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.handle('close-window', () => {
  if (mainWindow) mainWindow.close();
});

// Manejar errores no capturados
process.on('uncaughtException', (error) => {
  log.error('Error no capturado:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Rechazo no manejado:', reason);
});
