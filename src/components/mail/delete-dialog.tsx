'use client'

import * as React from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface DeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticketId: string
  onConfirm: () => void
  isDeleting?: boolean
}

export function DeleteDialog({ open, onOpenChange, ticketId, onConfirm, isDeleting }: DeleteDialogProps) {
  const [confirmText, setConfirmText] = React.useState('')

  const canDelete = confirmText === 'DELETE'

  const handleConfirm = () => {
    if (!canDelete) return
    onConfirm()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canDelete) {
      e.preventDefault()
      handleConfirm()
    }
  }

  // Reset on close
  React.useEffect(() => {
    if (!open) setConfirmText('')
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
            <DialogTitle className="text-sm">Delete ticket</DialogTitle>
          </div>
          <DialogDescription className="text-xs pt-2">
            This action cannot be undone. This will permanently delete ticket{' '}
            <span className="font-mono font-medium text-foreground">{ticketId}</span>{' '}
            and all associated messages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          <p className="text-[11px] text-muted-foreground">
            Type <span className="font-mono font-medium text-foreground">DELETE</span> to confirm:
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="DELETE"
            className="h-8 text-xs font-mono"
            autoFocus
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="text-xs h-7"
            onClick={handleConfirm}
            disabled={!canDelete || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete permanently'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
