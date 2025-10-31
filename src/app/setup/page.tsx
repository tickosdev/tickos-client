'use client'

import Image from 'next/image'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function SetupPage() {
  const { theme } = useTheme()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-[360px] space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center space-y-4">
          <div className="relative w-10 h-10">
            <Image
              src={theme === 'dark' ? '/dark.png' : '/ligth.png'}
              alt="TickOS"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-medium tracking-tight">Configure TickOS Client</h1>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-normal">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="h-10 text-sm"
              required
            />
            <p className="text-xs text-muted-foreground">
              Your TickOS account email
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="apikey" className="text-sm font-normal">
              API Key
            </Label>
            <Input
              id="apikey"
              type="password"
              placeholder="sk_..."
              className="h-10 text-sm"
              required
            />
            <p className="text-xs text-muted-foreground">
              Get your API key from{' '}
              <a 
                href="https://app.tickos.dev/settings/api-keys" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-tickos-green hover:underline"
              >
                app.tickos.dev
              </a>
            </p>
          </div>

          <Button 
            className="w-full h-10 bg-tickos-green hover:bg-tickos-green-hover text-sm font-normal"
            type="submit"
          >
            Save Configuration
          </Button>

          {/* Note */}
          <div className="pt-4 border-t border-border/50">
            <p className="text-xs text-center text-muted-foreground mb-2">
              <strong>Note:</strong> Add these values to your <code className="bg-muted px-1 py-0.5 rounded">.env.local</code> file:
            </p>
            <pre className="p-2 bg-muted rounded text-[11px] leading-relaxed">
{`TICKOS_USER_EMAIL=your@email.com
TICKOS_API_KEY=sk_your_key`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
