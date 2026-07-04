"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Inbox } from "@/lib/api-client"

interface InboxBadgesProps {
  inboxes: Inbox[]
  selectedInbox: Inbox | null
  onSelectInbox: (inbox: Inbox) => void
}

// Get initials from inbox name (e.g., "Plazbot Support" -> "PS")
function getInboxInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function InboxBadges({
  inboxes,
  selectedInbox,
  onSelectInbox,
}: InboxBadgesProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 overflow-x-auto">
      {inboxes.map((inbox) => (
        <button
          key={inbox.id}
          onClick={() => onSelectInbox(inbox)}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-md border text-xs font-medium transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary",
            selectedInbox?.id === inbox.id
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground border-border"
          )}
          title={inbox.name}
        >
          {getInboxInitials(inbox.name)}
        </button>
      ))}
    </div>
  )
}
