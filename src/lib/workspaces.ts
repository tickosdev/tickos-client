import fs from 'fs'
import path from 'path'

export interface WorkspaceConfig {
  name: string
  url: string
  key: string
  source?: 'env' | 'file'
}

const DATA_DIR = path.join(process.cwd(), 'data')
const DATA_FILE = path.join(DATA_DIR, 'workspaces.json')

/**
 * Lee workspaces persistidos en data/workspaces.json (gestionados desde la UI).
 */
function readFileWorkspaces(): WorkspaceConfig[] {
  try {
    if (!fs.existsSync(DATA_FILE)) return []
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    const parsed = JSON.parse(raw) as WorkspaceConfig[]
    return parsed
      .filter(w => w.name && w.url && w.key)
      .map(w => ({ ...w, source: 'file' as const }))
  } catch {
    console.error('[Workspaces] Failed to read data/workspaces.json')
    return []
  }
}

/**
 * Lee workspaces desde la variable de entorno TICKOS_WORKSPACES (seed opcional).
 * Formato: [{"name":"Plazbot","url":"http://localhost:3000","key":"sk_xxx"}, ...]
 */
function readEnvWorkspaces(): WorkspaceConfig[] {
  const raw = process.env.TICKOS_WORKSPACES
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as WorkspaceConfig[]
    return parsed
      .filter(w => w.name && w.url && w.key)
      .map(w => ({ ...w, source: 'env' as const }))
  } catch {
    console.error('[Workspaces] Failed to parse TICKOS_WORKSPACES')
    return []
  }
}

/**
 * Retorna todos los workspaces configurados.
 * Combina el archivo local (prioridad) con la variable de entorno (seed).
 */
export function getWorkspaces(): WorkspaceConfig[] {
  const fromFile = readFileWorkspaces()
  const fromEnv = readEnvWorkspaces().filter(
    e => !fromFile.some(f => f.name === e.name)
  )
  return [...fromFile, ...fromEnv]
}

/**
 * Obtiene la configuracion de un workspace por nombre.
 */
export function getWorkspaceByName(name: string): WorkspaceConfig | null {
  return getWorkspaces().find(w => w.name === name) || null
}

/**
 * Agrega (o reemplaza por nombre) un workspace en data/workspaces.json.
 */
export function addWorkspace(workspace: {
  name: string
  url: string
  key: string
}): void {
  const current = readFileWorkspaces().map(({ name, url, key }) => ({
    name,
    url,
    key,
  }))
  const updated = [
    ...current.filter(w => w.name !== workspace.name),
    { name: workspace.name, url: workspace.url, key: workspace.key },
  ]

  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  })
}

/**
 * Elimina un workspace de data/workspaces.json.
 * Retorna false si no existe en el archivo (ej: viene de la variable de entorno).
 */
export function removeWorkspace(name: string): boolean {
  const current = readFileWorkspaces()
  if (!current.some(w => w.name === name)) return false

  const updated = current
    .filter(w => w.name !== name)
    .map(({ name, url, key }) => ({ name, url, key }))

  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(DATA_FILE, JSON.stringify(updated, null, 2), {
    encoding: 'utf-8',
    mode: 0o600,
  })
  return true
}

/**
 * Valida la conexion de un workspace contra la API de tickos-core.
 * Retorna el nombre del workspace detectado (cuenta con is_current) o null si falla.
 */
export async function validateWorkspaceConnection(
  url: string,
  key: string
): Promise<{ name: string } | null> {
  try {
    const normalizedUrl = url.replace(/\/+$/, '')
    const response = await fetch(`${normalizedUrl}/api/v1/accounts`, {
      headers: { Authorization: key },
      signal: AbortSignal.timeout(10000),
    })

    if (!response.ok) return null

    const json = await response.json()
    const accounts = (json.data || []) as Array<{
      name: string
      is_current?: boolean
    }>
    const current = accounts.find(a => a.is_current) || accounts[0]

    return current?.name ? { name: current.name } : null
  } catch {
    return null
  }
}
