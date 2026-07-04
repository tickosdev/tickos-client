'use client'

import * as React from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

export default function SetupPage() {
  const { theme } = useTheme()
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [apiKey, setApiKey] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await fetch('/api/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, apiKey }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to save configuration')
        return
      }

      // Redirigir al inbox
      router.push('/')
      router.refresh()
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[360px] space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-10 h-10">
            {mounted && (
              <Image
                src={theme === 'dark' ? '/dark.png' : '/ligth.png'}
                alt="TickOS"
                fill
                className="object-contain"
                priority
              />
            )}
          </div>
          <div className="text-center space-y-1">
            <h1 className="text-lg font-medium tracking-tight">TickOS Client</h1>
            <p className="text-xs text-muted-foreground font-mono">Configure your API connection</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-normal">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="h-9 text-xs"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-[10px] text-muted-foreground">
              Your TickOS account email
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apikey" className="text-xs font-normal">
              API Key
            </Label>
            <Input
              id="apikey"
              type="password"
              placeholder="sk_..."
              className="h-9 text-xs font-mono"
              required
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-[10px] text-muted-foreground">
              Get your API key from{' '}
              <a
                href="https://app.tickos.dev/app/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                app.tickos.dev
              </a>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <Button
            className="w-full h-9 text-xs"
            type="submit"
            disabled={isLoading || !email || !apiKey}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                Validating...
              </>
            ) : (
              'Save Configuration'
            )}
          </Button>

          {/* Alternativa: env vars */}
          <div className="pt-4 border-t border-border/50">
            <p className="text-[10px] text-center text-muted-foreground mb-2">
              Or set environment variables in <code className="bg-muted px-1 py-0.5 rounded font-mono">.env.local</code>
            </p>
            <pre className="p-2 bg-muted rounded font-mono text-[10px] leading-relaxed text-muted-foreground">
{`TICKOS_API_KEY=sk_your_key
NEXT_PUBLIC_API_URL=https://api.tickos.dev`}
            </pre>
          </div>
        </form>
      </div>
    </div>
  )
}
