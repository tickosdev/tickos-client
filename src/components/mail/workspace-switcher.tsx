"use client"

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface ConfiguredWorkspace {
  name: string
}

interface WorkspaceSwitcherProps {
  workspaces: ConfiguredWorkspace[]
  activeWorkspace: string | null
  onSwitch: (name: string) => void
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

export function WorkspaceSwitcher({
  workspaces,
  activeWorkspace,
  onSwitch,
}: WorkspaceSwitcherProps) {
  const current = workspaces.find(w => w.name === activeWorkspace) || workspaces[0]

  if (workspaces.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-1.5 py-1 w-full">
        <div className="h-7 w-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-[10px] flex-shrink-0">
          {current ? getInitials(current.name) : 'W'}
        </div>
        <span className="text-xs font-medium truncate flex-1 text-left">
          {current?.name || 'No workspace'}
        </span>
      </div>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent transition-colors outline-none w-full">
          <div className="h-7 w-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-[10px] flex-shrink-0">
            {current ? getInitials(current.name) : 'W'}
          </div>
          <span className="text-xs font-medium truncate flex-1 text-left">
            {current?.name || 'Workspace'}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {workspaces.map((ws) => (
          <DropdownMenuItem
            key={ws.name}
            onClick={() => onSwitch(ws.name)}
            className={cn(
              "gap-3 cursor-pointer",
              activeWorkspace === ws.name && "bg-accent"
            )}
          >
            <div className="h-7 w-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-[10px] flex-shrink-0">
              {getInitials(ws.name)}
            </div>
            <span className="text-xs font-medium truncate">{ws.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
