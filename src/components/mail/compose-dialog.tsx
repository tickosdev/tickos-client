'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Inbox, composeEmail } from '@/lib/api-client'
import { X, Send, Loader2, PenSquare, Bold, Italic, Underline, Link2, List, ListOrdered, Paperclip, Maximize2, Minimize2 } from 'lucide-react'

interface ComposeDialogProps {
  inboxes: Inbox[]
  onSent?: () => void
}

const ICON_SIZE = 15
const ICON_STROKE = 1.5

function ToolbarBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            {icon}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function ComposeDialog({ inboxes, onSent }: ComposeDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [expanded, setExpanded] = React.useState(false)
  const [isSending, setIsSending] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const [inboxId, setInboxId] = React.useState('')
  const [toEmail, setToEmail] = React.useState('')
  const [cc, setCc] = React.useState('')
  const [bcc, setBcc] = React.useState('')
  const [showCc, setShowCc] = React.useState(false)
  const [showBcc, setShowBcc] = React.useState(false)
  const [subject, setSubject] = React.useState('')
  const [body, setBody] = React.useState('')

  React.useEffect(() => {
    if (inboxes.length > 0 && !inboxId) {
      setInboxId(inboxes[0].id)
    }
  }, [inboxes, inboxId])

  const resetForm = () => {
    setToEmail('')
    setCc('')
    setBcc('')
    setSubject('')
    setBody('')
    setShowCc(false)
    setShowBcc(false)
    setError(null)
  }

  const handleClose = () => {
    setOpen(false)
    resetForm()
  }

  const handleSend = async () => {
    if (!inboxId || !toEmail || !subject || !body) {
      setError('Fill all required fields')
      return
    }

    setError(null)
    setIsSending(true)

    try {
      await composeEmail({
        inbox_id: inboxId,
        to_email: toEmail,
        cc: cc || undefined,
        bcc: bcc || undefined,
        subject,
        body_text: body,
        body_html: `<p>${body.replace(/\n/g, '<br>')}</p>`,
      })

      resetForm()
      setOpen(false)
      onSent?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const selectedInbox = inboxes.find(i => i.id === inboxId)

  return (
    <>
      {/* Trigger button */}
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(true)} title="Compose">
        <PenSquare className="h-3.5 w-3.5" />
      </Button>

      {/* Compose panel — bottom-right overlay */}
      {open && (
        <div
          className={`fixed inset-0 z-50 flex ${expanded ? 'items-center justify-center p-8' : 'items-end justify-end p-4'} bg-black/20`}
          onClick={handleClose}
        >
          <div
            className={`bg-background border rounded-lg shadow-2xl w-full flex flex-col ${expanded ? 'max-w-[900px]' : 'max-w-[580px]'}`}
            style={{ maxHeight: expanded ? '90vh' : '80vh' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b bg-muted/30 rounded-t-lg">
              <h3 className="text-sm font-semibold">New Email</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                  title={expanded ? 'Minimize' : 'Expand'}
                >
                  {expanded
                    ? <Minimize2 size={14} strokeWidth={1.5} />
                    : <Maximize2 size={14} strokeWidth={1.5} />
                  }
                </button>
                <button
                  onClick={handleClose}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                >
                  <X size={16} strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* Fields */}
            <div className="px-4">
              {/* From */}
              <div className="flex items-center gap-3 py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground w-14 flex-shrink-0 font-mono uppercase tracking-wider">From</span>
                <Select value={inboxId} onValueChange={setInboxId}>
                  <SelectTrigger className="flex-1 h-8 border-none shadow-none bg-transparent text-xs focus:ring-0 px-0">
                    <SelectValue>
                      {selectedInbox
                        ? `${selectedInbox.name}${selectedInbox.email_address ? ` (${selectedInbox.email_address})` : ''}`
                        : 'Select inbox'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {inboxes.map(inbox => (
                      <SelectItem key={inbox.id} value={inbox.id} className="text-xs">
                        {inbox.name} {inbox.email_address && `(${inbox.email_address})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* To */}
              <div className="flex items-center gap-3 py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground w-14 flex-shrink-0 font-mono uppercase tracking-wider">To</span>
                <input
                  type="text"
                  value={toEmail}
                  onChange={(e) => setToEmail(e.target.value)}
                  placeholder="recipient@example.com"
                  className="flex-1 text-xs bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground"
                />
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!showCc && (
                    <button
                      onClick={() => setShowCc(true)}
                      className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-accent transition-colors font-mono"
                    >
                      CC
                    </button>
                  )}
                  {!showBcc && (
                    <button
                      onClick={() => setShowBcc(true)}
                      className="text-[10px] text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded hover:bg-accent transition-colors font-mono"
                    >
                      BCC
                    </button>
                  )}
                </div>
              </div>

              {/* CC */}
              {showCc && (
                <div className="flex items-center gap-3 py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground w-14 flex-shrink-0 font-mono uppercase tracking-wider">CC</span>
                  <input
                    type="text"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@example.com"
                    className="flex-1 text-xs bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              )}

              {/* BCC */}
              {showBcc && (
                <div className="flex items-center gap-3 py-2 border-b border-border/50">
                  <span className="text-xs text-muted-foreground w-14 flex-shrink-0 font-mono uppercase tracking-wider">BCC</span>
                  <input
                    type="text"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="bcc@example.com"
                    className="flex-1 text-xs bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              )}

              {/* Subject */}
              <div className="flex items-center gap-3 py-2 border-b border-border/50">
                <span className="text-xs text-muted-foreground w-14 flex-shrink-0 font-mono uppercase tracking-wider">Subject</span>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  className="flex-1 text-xs bg-transparent border-none focus:outline-none text-foreground placeholder:text-muted-foreground"
                />
              </div>
            </div>

            {/* Formatting toolbar */}
            <div className="flex items-center gap-0.5 px-4 py-1.5 border-b border-border/50">
              <ToolbarBtn icon={<Bold size={ICON_SIZE} strokeWidth={ICON_STROKE} />} label="Bold" />
              <ToolbarBtn icon={<Italic size={ICON_SIZE} strokeWidth={ICON_STROKE} />} label="Italic" />
              <ToolbarBtn icon={<Underline size={ICON_SIZE} strokeWidth={ICON_STROKE} />} label="Underline" />
              <Separator orientation="vertical" className="mx-1 h-4" />
              <ToolbarBtn icon={<List size={ICON_SIZE} strokeWidth={ICON_STROKE} />} label="List" />
              <ToolbarBtn icon={<ListOrdered size={ICON_SIZE} strokeWidth={ICON_STROKE} />} label="Ordered list" />
              <Separator orientation="vertical" className="mx-1 h-4" />
              <ToolbarBtn icon={<Link2 size={ICON_SIZE} strokeWidth={ICON_STROKE} />} label="Link" />
              <ToolbarBtn icon={<Paperclip size={ICON_SIZE} strokeWidth={ICON_STROKE} />} label="Attach file" />
            </div>

            {/* Body */}
            <div className="flex-1 px-4 py-3 min-h-0 overflow-auto">
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Write your message..."
                className={`w-full h-full text-xs bg-transparent border-none resize-none focus:outline-none text-foreground placeholder:text-muted-foreground leading-relaxed ${expanded ? 'min-h-[400px]' : 'min-h-[200px]'}`}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="mx-4 mb-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-1.5">
                <p className="text-[10px] text-destructive font-mono">{error}</p>
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-2 border-t">
              <span className="text-[10px] text-muted-foreground font-mono">
                Cmd+Enter to send
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleClose} className="text-xs h-7 px-3">
                  Discard
                </Button>
                <Button
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={handleSend}
                  disabled={isSending || !toEmail || !subject || !body}
                >
                  {isSending ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-3 w-3" />
                      Send
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
