"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
    .slice(0, 1)
}

export function WorkspaceSwitcher({
  accounts,
  selectedAccount,
  onSelectAccount,
  isCollapsed = false,
}: WorkspaceSwitcherProps) {
  return (
    <Select
      value={selectedAccount?.id || ''}
      onValueChange={(value) => {
        const account = accounts.find((acc) => acc.id === value)
        if (account) onSelectAccount(account)
      }}
    >
      <SelectTrigger
        className="h-10 w-10 shrink-0 items-center justify-center p-0 border-0 bg-transparent hover:bg-accent [&>span]:w-auto"
        aria-label="Select workspace"
      >
        <SelectValue placeholder="W">
          <div className="h-10 w-10 flex items-center justify-center rounded-md bg-[#16a349] text-white font-bold text-sm">
            {selectedAccount ? getInitials(selectedAccount.name) : 'W'}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            <div className="flex items-center gap-3">
              <div className="h-6 w-6 flex items-center justify-center rounded-md bg-[#16a349] text-white font-semibold text-xs">
                {getInitials(account.name)}
              </div>
              {account.name}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
