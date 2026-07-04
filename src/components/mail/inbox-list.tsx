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

export function InboxList({ inboxes, selectedInbox, onSelectInbox }: InboxListProps) {
  return (
    <div className="py-2 px-2">
      <span className="px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        Inboxes
      </span>
      <ul className="flex flex-col gap-0.5 mt-1.5">
        {inboxes.map((inbox) => (
          <li key={inbox.id}>
            <button
              onClick={() => onSelectInbox(inbox)}
              className={cn(
                "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                selectedInbox?.id === inbox.id
                  ? "bg-accent text-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <span
                className={cn(
                  "h-5 w-5 flex items-center justify-center rounded text-[9px] font-semibold flex-shrink-0",
                  selectedInbox?.id === inbox.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground"
                )}
              >
                {getInitials(inbox.name)}
              </span>
              <span className="truncate">{inbox.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
