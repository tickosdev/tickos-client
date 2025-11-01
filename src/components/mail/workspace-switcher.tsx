"use client"

import * as React from "react"
import { HiOutlineChevronDown } from "react-icons/hi"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
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
        className={cn(
          "border-0 bg-transparent hover:bg-accent",
          isCollapsed 
            ? "h-10 w-10 p-0 items-center justify-center [&>span]:w-auto"
            : "h-7 px-1.5 gap-1.5 text-[13px] font-normal"
        )}
        aria-label="Select workspace"
      >
        <SelectValue placeholder="W">
          {isCollapsed ? (
            <Avatar className="h-4 w-4 rounded-[4px]">
              <AvatarFallback className="text-[9px] bg-[#16a349] text-white rounded-[4px] font-medium">
                {selectedAccount ? getInitials(selectedAccount.name) : 'W'}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="flex items-center gap-1.5">
              <Avatar className="h-4 w-4 rounded-[4px]">
                <AvatarFallback className="text-[9px] bg-[#16a349] text-white rounded-[4px] font-medium">
                  {selectedAccount ? getInitials(selectedAccount.name) : 'W'}
                </AvatarFallback>
              </Avatar>
              <span className="hidden sm:inline">
                {selectedAccount?.name || 'Loading...'}
              </span>
              <HiOutlineChevronDown className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="start" className="w-[280px]">
        {accounts.map((account) => (
          <SelectItem key={account.id} value={account.id}>
            <div className="flex items-center gap-3">
              <Avatar className="h-4 w-4 rounded-[4px]">
                <AvatarFallback className="text-[9px] bg-[#16a349] text-white rounded-[4px] font-medium">
                  {getInitials(account.name)}
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">{account.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
