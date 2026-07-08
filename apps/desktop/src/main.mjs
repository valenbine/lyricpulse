import { app, BrowserWindow, dialog, shell } from 'electron'
import { appendFile, mkdir, stat } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tsImport } from 'tsx/esm/api'

const currentDir = dirname(fileURLToPath(import.meta.url))
const appRoot = app.isPackaged ? resolve(currentDir, '..') : resolve(currentDir, '../../..')
const sourceRoot = app.isPackaged
  ? join(process.resourcesPath, 'runtime')
  : appRoot

let apiServer
let mainWindow
let logFilePath

async function writeDesktopLog(message, details) {
  const targetPath = logFilePath ?? join(app.getPath('userData'), 'desktop.log')
  const payload = details ? ` ${JSON.stringify(details)}` : ''

  try {
    await mkdir(dirname(targetPath), { recursive: true })
    await appendFile(targetPath, `[${new Date().toISOString()}] ${message}${payload}\n`)
  } catch {
    // Logging must never block startup.
  }
}

async function pathExists(path) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

function configurePackagedBinaryPaths() {
  if (!app.isPackaged || process.platform !== 'win32') {
    return
  }

  process.env.ESBUILD_BINARY_PATH ??= join(
    process.resourcesPath,
    'app.asar.unpacked',
    'node_modules',
    '@esbuild',
    'win32-x64',
    'esbuild.exe'
  )
}

async function getWebDistRoot() {
  if (!app.isPackaged) {
    return resolve(sourceRoot, 'apps/web/dist')
  }

  const unpackedWebDistRoot = join(
    process.resourcesPath,
    'runtime',
    'apps',
    'web',
    'dist'
  )

  if (await pathExists(join(unpackedWebDistRoot, 'index.html'))) {
    return unpackedWebDistRoot
  }

  return resolve(appRoot, 'apps/web/dist')
}

async function assertWebDistRoot(webDistRoot) {
  await stat(join(webDistRoot, 'index.html'))
}

async function startApiServer() {
  const storageRoot = join(app.getPath('userData'), 'storage')
  const webDistRoot = await getWebDistRoot()
  await mkdir(storageRoot, { recursive: true })
  await assertWebDistRoot(webDistRoot)
  await writeDesktopLog('Starting local API server.', {
    isPackaged: app.isPackaged,
    appRoot,
    sourceRoot,
    storageRoot,
    webDistRoot
  })

  const { buildApp } = await tsImport(
    pathToFileURL(resolve(sourceRoot, 'apps/api/src/app.ts')).href,
    import.meta.url
  )
  const server = buildApp({ storageRoot, webDistRoot })
  await server.listen({ port: 0, host: '127.0.0.1' })

  const address = server.server.address()
  if (!address || typeof address === 'string') {
    throw new Error('LyricPulse API did not expose a local TCP port.')
  }

  return {
    server,
    url: `http://127.0.0.1:${address.port}`
  }
}

function attachRendererDiagnostics(window) {
  window.webContents.on('console-message', (_event, ...args) => {
    void writeDesktopLog('Renderer console message.', { args })
  })

  window.webContents.on(
    'did-fail-load',
    (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      void writeDesktopLog('Renderer failed to load.', {
        errorCode,
        errorDescription,
        validatedURL,
        isMainFrame
      })
    }
  )

  window.webContents.on('render-process-gone', (_event, details) => {
    void writeDesktopLog('Renderer process ended.', details)
  })

  window.webContents.on('did-finish-load', () => {
    void writeDesktopLog('Renderer finished loading.', {
      url: window.webContents.getURL()
    })
  })
}

async function createMainWindow(appUrl) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    backgroundColor: '#020617',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  attachRendererDiagnostics(mainWindow)

  await mainWindow.loadURL(appUrl)
}

async function bootstrap() {
  logFilePath = join(app.getPath('userData'), 'desktop.log')
  configurePackagedBinaryPaths()
  await writeDesktopLog('Bootstrapping LyricPulse desktop.', {
    isPackaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
    esbuildBinaryPath: process.env.ESBUILD_BINARY_PATH
  })
  apiServer = await startApiServer()
  await writeDesktopLog('Local API server is listening.', {
    url: apiServer.url
  })
  await createMainWindow(apiServer.url)
}

app.whenReady().then(() => {
  void bootstrap().catch((error) => {
    dialog.showErrorBox(
      'LyricPulse failed to start',
      error instanceof Error ? error.message : String(error)
    )
    app.quit()
  })
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0 && apiServer) {
    void createMainWindow(apiServer.url)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  void apiServer?.server.close()
})
