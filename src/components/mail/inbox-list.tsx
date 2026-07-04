"use client"

import * as React from "react"
import { Mail, ClipboardList, Code, Inbox as InboxIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Inbox } from "@/lib/api-client"

interface InboxListProps {
  inboxes: Inbox[]
  selectedInbox: Inbox | null
  onSelectInbox: (inbox: Inbox) => void
  isLoading?: boolean
}

// Icono segun el tipo de canal (mismo mapeo que tickos-core)
function getChannelIcon(channelType: string) {
  switch (channelType) {
    case 'email':
      return <Mail className="h-3 w-3" />
    case 'form':
      return <ClipboardList className="h-3 w-3" />
    case 'api':
      return <Code className="h-3 w-3" />
    default:
      return <InboxIcon className="h-3 w-3" />
  }
}

export function InboxList({ inboxes, selectedInbox, onSelectInbox, isLoading }: InboxListProps) {
  if (isLoading && inboxes.length === 0) {
    return (
      <div className="py-2 px-2">
        <span className="px-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          Inboxes
        </span>
        <div className="flex flex-col gap-1 mt-1.5 px-2">
          {[0, 1, 2].map(i => (
            <div key={i} className="flex items-center gap-2 py-1.5">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-3 flex-1" />
            </div>
          ))}
        </div>
      </div>
    )
  }

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
                  "h-5 w-5 flex items-center justify-center rounded flex-shrink-0",
                  selectedInbox?.id === inbox.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-muted-foreground"
                )}
              >
                {getChannelIcon(inbox.channel_type)}
              </span>
              <span className="truncate">{inbox.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
