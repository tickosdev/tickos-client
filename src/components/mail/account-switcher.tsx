'use client'

import * as React from 'react'
import { Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Workspace {
  id: string
  name: string
  account_id: string
}

interface AccountSwitcherProps {
  isCollapsed: boolean
  workspaces: Workspace[]
}

export function AccountSwitcher({
  isCollapsed,
  workspaces,
}: AccountSwitcherProps) {
  const [selectedWorkspace, setSelectedWorkspace] = React.useState<string>(
    workspaces[0]?.account_id || ''
  )

  return (
    <Select defaultValue={selectedWorkspace} onValueChange={setSelectedWorkspace}>
      <SelectTrigger
        className={cn(
          'flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0',
          isCollapsed &&
            'flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>span]:w-auto [&>svg]:hidden'
        )}
        aria-label="Select workspace"
      >
        <SelectValue placeholder="Select workspace">
          <Building2 className="h-4 w-4" />
          <span className={cn('ml-2', isCollapsed && 'hidden')}>
            {
              workspaces.find((ws) => ws.account_id === selectedWorkspace)
                ?.name || 'Workspace'
            }
          </span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {workspaces.map((workspace) => (
          <SelectItem key={workspace.account_id} value={workspace.account_id}>
            <div className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
              <Building2 className="h-4 w-4" />
              {workspace.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
