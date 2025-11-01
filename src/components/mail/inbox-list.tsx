"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Inbox } from "@/lib/api-client"

interface InboxListProps {
  inboxes: Inbox[]
  selectedInbox: Inbox | null
  onSelectInbox: (inbox: Inbox) => void
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

interface InboxListWithToggleProps extends InboxListProps {
  themeToggle?: React.ReactNode
}

export function InboxList({ inboxes, selectedInbox, onSelectInbox, themeToggle }: InboxListWithToggleProps) {
  return (
    <div className="flex h-full flex-col items-center">
      <div className="flex-1 overflow-auto py-2">
        <ul className="flex flex-col gap-2 items-center">
          {inboxes.map((inbox) => (
            <li key={inbox.id}>
              <button
                onClick={() => onSelectInbox(inbox)}
                className={cn(
                  "h-4 w-4 flex items-center justify-center rounded-[4px] font-medium text-[9px] transition-colors",
                  selectedInbox?.id === inbox.id
                    ? "bg-[#16a349] text-white"
                    : "bg-muted text-foreground hover:bg-accent"
                )}
                title={inbox.name}
              >
                {getInitials(inbox.name)}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {themeToggle && (
        <div className="mt-auto border-t p-2">
          <div className="flex items-center justify-center">
            {themeToggle}
          </div>
        </div>
      )}
    </div>
  )
}
