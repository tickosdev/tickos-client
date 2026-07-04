'use client'

import * as React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [checkingConfig, setCheckingConfig] = React.useState(true)
  const [noWorkspaces, setNoWorkspaces] = React.useState(false)

  // Setup wizard state
  const [apiUrl, setApiUrl] = React.useState('https://api.tickos.dev')
  const [apiKey, setApiKey] = React.useState('')
  const [setupLoading, setSetupLoading] = React.useState(false)
  const [setupError, setSetupError] = React.useState('')
  const [connectedWorkspace, setConnectedWorkspace] = React.useState('')

  // Verificar si hay workspaces configurados
  React.useEffect(() => {
    fetch('/api/auth/workspaces/config')
      .then(res => res.json())
      .then(data => {
        setNoWorkspaces(!data.data || data.data.length === 0)
      })
      .catch(() => setNoWorkspaces(true))
      .finally(() => setCheckingConfig(false))
  }, [])

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setSetupLoading(true)
    setSetupError('')

    try {
      const response = await fetch('/api/auth/workspaces/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: apiUrl, key: apiKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        setSetupError(data.error || 'Could not connect to the workspace')
        return
      }

      setConnectedWorkspace(data.data.name)
      setNoWorkspaces(false)
      setApiKey('')
    } catch {
      setSetupError('Connection error. Check that the API is reachable.')
    } finally {
      setSetupLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Invalid email or password')
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setError('Connection error. Check that the API is reachable.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-[360px] space-y-6">
        {/* Brand */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative h-10 w-10">
            <Image
              src="/ligth.png"
              alt="TickOS"
              fill
              className="object-contain dark:hidden"
              priority
            />
            <Image
              src="/dark.png"
              alt="TickOS"
              fill
              className="hidden object-contain dark:block"
              priority
            />
          </div>
          <h1 className="font-mono text-base font-medium tracking-tight">
            {noWorkspaces ? 'Set up TickOS' : 'Sign in to TickOS'}
          </h1>
          <p className="text-xs text-muted-foreground text-center">
            {noWorkspaces
              ? 'Connect your first workspace to get started'
              : 'Enter your credentials to access the support desk'}
          </p>
        </div>

        {checkingConfig ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : noWorkspaces ? (
          /* Setup wizard: primer workspace */
          <form onSubmit={handleSetup} className="space-y-3 border rounded-lg p-5 bg-card">
            <div className="space-y-1.5">
              <Label
                htmlFor="api-url"
                className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
              >
                API URL
              </Label>
              <Input
                id="api-url"
                type="url"
                placeholder="https://api.tickos.dev"
                value={apiUrl}
                onChange={e => setApiUrl(e.target.value)}
                className="h-9 font-mono text-xs"
                required
                disabled={setupLoading}
                autoFocus
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="api-key"
                className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
              >
                API Key
              </Label>
              <Input
                id="api-key"
                type="password"
                placeholder="sk_..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="h-9 font-mono text-xs"
                required
                disabled={setupLoading}
              />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Create an API key from your TickOS dashboard under Settings → API Keys.
                The workspace name is detected automatically.
              </p>
            </div>

            {setupError && (
              <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-md p-2.5">
                {setupError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-9 text-xs font-medium"
              disabled={setupLoading}
            >
              {setupLoading ? 'Verifying connection...' : 'Connect workspace'}
            </Button>
          </form>
        ) : (
          /* Login form */
          <>
            {connectedWorkspace && (
              <div className="flex items-center gap-2 text-xs bg-muted/50 border rounded-md p-3">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                <p>
                  Workspace <span className="font-medium">{connectedWorkspace}</span> connected.
                  Sign in with your agent credentials.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 border rounded-lg p-5 bg-card">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="h-9 font-mono text-xs"
                  required
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="h-9 text-xs"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-md p-2.5">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-9 text-xs font-medium"
                disabled={loading}
              >
                {loading ? 'Connecting...' : 'Sign in'}
              </Button>
            </form>
          </>
        )}

        <p className="text-center text-[10px] text-muted-foreground font-mono">
          Powered by TickOS API
        </p>
      </div>
    </div>
  )
}
