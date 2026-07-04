'use client'

import * as React from 'react'
import { Plus, Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSplitInbox } from '@/hooks/use-split-inbox'
import { SplitInboxSettings } from './split-inbox-settings'

interface SplitInboxTabsProps {
  onViewChange?: () => void
}

export function SplitInboxTabs({ onViewChange }: SplitInboxTabsProps) {
  const { visibleViews, activeViewId, setActiveViewId } = useSplitInbox()

  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [settingsScreen, setSettingsScreen] = React.useState<'list' | 'create'>('list')

  const handleSelect = (viewId: string) => {
    setActiveViewId(viewId)
    onViewChange?.()
  }

  const openSettings = (screen: 'list' | 'create') => {
    setSettingsScreen(screen)
    setSettingsOpen(true)
  }

  return (
    <div className="py-2 px-2">
      <div className="flex items-center justify-between px-2 mb-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Views
        </span>

        <div className="flex items-center gap-0.5">
          {/* Configurar vistas */}
          <button
            onClick={() => openSettings('list')}
            className="h-4 w-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
            title="Split inbox settings"
          >
            <Settings2 className="h-3 w-3" />
          </button>
          {/* Crear vista */}
          <button
            onClick={() => openSettings('create')}
            className="h-4 w-4 flex items-center justify-center rounded text-muted-foreground hover:text-foreground transition-colors"
            title="New split inbox"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      <ul className="flex flex-col gap-0.5">
        {visibleViews.map((view) => (
          <li key={view.id}>
            <button
              onClick={() => handleSelect(view.id)}
              className={cn(
                'w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors',
                view.id === activeViewId
                  ? 'bg-accent text-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              )}
            >
              <span className={cn(
                'h-1.5 w-1.5 rounded-full flex-shrink-0',
                view.id === activeViewId ? 'bg-primary' : 'bg-muted-foreground/40'
              )} />
              <span className="truncate flex-1 text-left">{view.name}</span>
            </button>
          </li>
        ))}
      </ul>

      <SplitInboxSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        initialScreen={settingsScreen}
        onChanged={onViewChange}
      />
    </div>
  )
}
