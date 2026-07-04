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
import { Account } from "@/lib/api-client"

interface WorkspaceSwitcherProps {
  accounts: Account[]
  selectedAccount: Account | null
  onSelectAccount: (account: Account) => void
  isCollapsed?: boolean
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
  accounts,
  selectedAccount,
  onSelectAccount,
}: WorkspaceSwitcherProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent transition-colors outline-none w-full">
          <div className="h-7 w-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground font-bold text-[10px] flex-shrink-0">
            {selectedAccount ? getInitials(selectedAccount.name) : 'W'}
          </div>
          <span className="text-xs font-medium truncate flex-1 text-left">
            {selectedAccount?.name || 'Workspace'}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        {accounts.map((account) => (
          <DropdownMenuItem
            key={account.id}
            onClick={() => onSelectAccount(account)}
            className={cn(
              "gap-3 cursor-pointer",
              selectedAccount?.id === account.id && "bg-accent"
            )}
          >
            <div className="h-7 w-7 flex items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold text-[10px] flex-shrink-0">
              {getInitials(account.name)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium truncate">{account.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono">{account.slug}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
