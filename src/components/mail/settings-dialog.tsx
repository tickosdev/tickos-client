'use client'

import * as React from 'react'
import { Settings, LogOut, Loader2, Server, Trash2, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface WorkspaceItem {
  name: string
  url: string
  key_preview: string
  source?: 'env' | 'file'
}

interface SettingsDialogProps {
  onWorkspacesChange?: () => void
}

export function SettingsDialog({ onWorkspacesChange }: SettingsDialogProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const [workspaces, setWorkspaces] = React.useState<WorkspaceItem[]>([])
  const [loading, setLoading] = React.useState(false)

  // Form para agregar workspace
  const [showAddForm, setShowAddForm] = React.useState(false)
  const [apiUrl, setApiUrl] = React.useState('https://api.tickos.dev')
  const [apiKey, setApiKey] = React.useState('')
  const [addLoading, setAddLoading] = React.useState(false)
  const [addError, setAddError] = React.useState('')
  const [removingName, setRemovingName] = React.useState('')

  const loadWorkspaces = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/auth/workspaces/config')
      if (res.ok) {
        const data = await res.json()
        setWorkspaces(data.data || [])
      }
    } catch {
      console.error('Failed to load workspaces')
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (open) {
      loadWorkspaces()
      setShowAddForm(false)
      setAddError('')
    }
  }, [open, loadWorkspaces])

  const handleAddWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    setAddLoading(true)
    setAddError('')

    try {
      const res = await fetch('/api/auth/workspaces/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: apiUrl, key: apiKey }),
      })

      const data = await res.json()

      if (!res.ok) {
        setAddError(data.error || 'Could not connect to the workspace')
        return
      }

      setApiKey('')
      setShowAddForm(false)
      await loadWorkspaces()
      onWorkspacesChange?.()
    } catch {
      setAddError('Connection error. Check that the API is reachable.')
    } finally {
      setAddLoading(false)
    }
  }

  const handleRemoveWorkspace = async (name: string) => {
    setRemovingName(name)
    try {
      const res = await fetch('/api/auth/workspaces/config', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      if (res.ok) {
        await loadWorkspaces()
        onWorkspacesChange?.()
      }
    } catch {
      console.error('Failed to remove workspace')
    } finally {
      setRemovingName('')
    }
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-7 w-7" title="Settings">
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Workspaces */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                Workspaces
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px] gap-1"
                onClick={() => {
                  setShowAddForm(v => !v)
                  setAddError('')
                }}
              >
                <Plus className="h-3 w-3" />
                Add workspace
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-1">
                {workspaces.map(ws => (
                  <div
                    key={ws.name}
                    className="flex items-center gap-2.5 rounded-md border px-3 py-2"
                  >
                    <Server className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="text-xs font-medium truncate">
                        {ws.name}
                        {ws.source === 'env' && (
                          <span className="ml-1.5 font-mono text-[9px] uppercase text-muted-foreground border rounded px-1 py-0.5">
                            env
                          </span>
                        )}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground truncate">
                        {ws.url} &middot; {ws.key_preview}
                      </p>
                    </div>
                    {ws.source !== 'env' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 flex-shrink-0 text-muted-foreground hover:text-destructive"
                        title="Remove workspace"
                        disabled={removingName === ws.name}
                        onClick={() => handleRemoveWorkspace(ws.name)}
                      >
                        {removingName === ws.name ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    )}
                  </div>
                ))}

                {workspaces.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-3">
                    No workspaces configured
                  </p>
                )}
              </div>
            )}

            {/* Form agregar workspace */}
            {showAddForm && (
              <form
                onSubmit={handleAddWorkspace}
                className="space-y-2 rounded-md border bg-muted/30 p-3"
              >
                <Input
                  type="url"
                  placeholder="API URL (https://api.tickos.dev)"
                  value={apiUrl}
                  onChange={e => setApiUrl(e.target.value)}
                  className="h-8 font-mono text-xs"
                  required
                  disabled={addLoading}
                />
                <Input
                  type="password"
                  placeholder="API Key (sk_...)"
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="h-8 font-mono text-xs"
                  required
                  disabled={addLoading}
                />

                {addError && (
                  <p className="text-[10px] text-destructive">{addError}</p>
                )}

                <div className="flex items-center gap-2">
                  <Button
                    type="submit"
                    size="sm"
                    className="h-7 text-[10px] flex-1"
                    disabled={addLoading}
                  >
                    {addLoading ? 'Verifying...' : 'Connect'}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px]"
                    disabled={addLoading}
                    onClick={() => setShowAddForm(false)}
                  >
                    Cancel
                  </Button>
                </div>

                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Each API key belongs to one workspace. The name is detected
                  automatically from the TickOS API.
                </p>
              </form>
            )}
          </div>

          <Separator />

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full rounded-md px-3 py-2 text-xs hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
