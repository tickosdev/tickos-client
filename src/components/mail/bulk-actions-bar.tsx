'use client'

import * as React from 'react'
import { X, Mail, MailOpen, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  bulkMarkRead,
  bulkMarkUnread,
  bulkArchive,
  bulkUnarchive,
  bulkDelete,
} from '@/lib/api-client'
import { DeleteDialog } from './delete-dialog'

interface BulkActionsBarProps {
  selectedIds: Set<string>
  onClear: () => void
  onComplete: () => void
}

export function BulkActionsBar({ selectedIds, onClear, onComplete }: BulkActionsBarProps) {
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)

  if (selectedIds.size === 0) return null

  const ids = Array.from(selectedIds)

  const handleAction = async (action: () => Promise<void>) => {
    try {
      await action()
      onClear()
      onComplete()
    } catch (error) {
      console.error('Bulk action error:', error)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await bulkDelete(ids)
      setShowDeleteDialog(false)
      onClear()
      onComplete()
    } catch (error) {
      console.error('Bulk delete error:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-50 flex items-center gap-0.5 rounded-lg border bg-background/95 backdrop-blur-sm px-1.5 py-1 shadow-md">
      <span className="font-mono text-[11px] font-medium text-foreground px-2 tabular-nums">
        {selectedIds.size}
      </span>

      <div className="w-px h-4 bg-border mx-1" />

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
            onClick={() => handleAction(() => bulkMarkRead(ids))}
          >
            <MailOpen className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">Mark as read</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
            onClick={() => handleAction(() => bulkMarkUnread(ids))}
          >
            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">Mark as unread</TooltipContent>
      </Tooltip>

      <div className="w-px h-4 bg-border mx-0.5" />

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
            onClick={() => handleAction(() => bulkArchive(ids))}
          >
            <Archive className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">Archive</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
            onClick={() => handleAction(() => bulkUnarchive(ids))}
          >
            <ArchiveRestore className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">Unarchive</TooltipContent>
      </Tooltip>

      <div className="w-px h-4 bg-border mx-0.5" />

      <Tooltip>
        <TooltipTrigger asChild>
          <button
            className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 transition-colors"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">Delete</TooltipContent>
      </Tooltip>

      <div className="w-px h-4 bg-border mx-0.5" />

      <button
        className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-accent transition-colors"
        onClick={onClear}
      >
        <X className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {/* Confirmacion de borrado masivo */}
      <DeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        count={ids.length}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}
