import { app, BrowserWindow, dialog, shell } from 'electron'
import { mkdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { tsImport } from 'tsx/esm/api'

const currentDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = app.isPackaged ? resolve(currentDir, '..') : resolve(currentDir, '../../..')

let apiServer
let mainWindow

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

async function startApiServer() {
  const storageRoot = join(app.getPath('userData'), 'storage')
  const webDistRoot = resolve(repoRoot, 'apps/web/dist')
  await mkdir(storageRoot, { recursive: true })

  const { buildApp } = await tsImport(
    pathToFileURL(resolve(repoRoot, 'apps/api/src/app.ts')).href,
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

  await mainWindow.loadURL(appUrl)
}

async function bootstrap() {
  configurePackagedBinaryPaths()
  apiServer = await startApiServer()
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
