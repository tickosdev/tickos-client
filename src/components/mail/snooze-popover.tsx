'use client'

import * as React from 'react'
import { Clock, ChevronRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { snoozeTicket } from '@/lib/api-client'

interface SnoozePopoverProps {
  ticketId: string
  onComplete?: () => void
  children?: React.ReactNode
}

// Quick pick helpers
function getTomorrow9AM(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  return d
}

function getIn3Hours(): Date {
  const d = new Date()
  d.setHours(d.getHours() + 3)
  return d
}

function getNextMonday(): Date {
  const d = new Date()
  const day = d.getDay()
  const diff = day === 0 ? 1 : 8 - day
  d.setDate(d.getDate() + diff)
  d.setHours(9, 0, 0, 0)
  return d
}

function getIn1Week(): Date {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  d.setHours(9, 0, 0, 0)
  return d
}

const QUICK_PICKS = [
  { label: 'Tomorrow 9 AM', getDate: getTomorrow9AM },
  { label: 'In 3 hours', getDate: getIn3Hours },
  { label: 'Next Monday', getDate: getNextMonday },
  { label: 'In 1 week', getDate: getIn1Week },
]

// Parse natural language to date
function parseNaturalDate(input: string): Date | null {
  const now = new Date()
  const lower = input.toLowerCase().trim()

  // "tomorrow at 9am"
  const tomorrowMatch = lower.match(/tomorrow\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/)
  if (tomorrowMatch) {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    let hour = parseInt(tomorrowMatch[1])
    if (tomorrowMatch[3] === 'pm' && hour < 12) hour += 12
    if (tomorrowMatch[3] === 'am' && hour === 12) hour = 0
    d.setHours(hour, parseInt(tomorrowMatch[2] || '0'), 0, 0)
    return d
  }

  // "in X hours"
  const hoursMatch = lower.match(/in\s+(\d+)\s+hours?/)
  if (hoursMatch) {
    const d = new Date(now)
    d.setHours(d.getHours() + parseInt(hoursMatch[1]))
    return d
  }

  // "in X days"
  const daysMatch = lower.match(/in\s+(\d+)\s+days?/)
  if (daysMatch) {
    const d = new Date(now)
    d.setDate(d.getDate() + parseInt(daysMatch[1]))
    d.setHours(9, 0, 0, 0)
    return d
  }

  // "friday at 10pm", "monday at 9am" etc.
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayMatch = lower.match(new RegExp(`(${dayNames.join('|')})\\s+(?:at\\s+)?(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm)?`))
  if (dayMatch) {
    const targetDay = dayNames.indexOf(dayMatch[1])
    const d = new Date(now)
    let daysToAdd = targetDay - d.getDay()
    if (daysToAdd <= 0) daysToAdd += 7
    d.setDate(d.getDate() + daysToAdd)
    let hour = parseInt(dayMatch[2])
    if (dayMatch[4] === 'pm' && hour < 12) hour += 12
    if (dayMatch[4] === 'am' && hour === 12) hour = 0
    d.setHours(hour, parseInt(dayMatch[3] || '0'), 0, 0)
    return d
  }

  // "tomorrow"
  if (lower === 'tomorrow') {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    d.setHours(9, 0, 0, 0)
    return d
  }

  return null
}

export function SnoozePopover({ ticketId, onComplete, children }: SnoozePopoverProps) {
  const [open, setOpen] = React.useState(false)
  const [nlInput, setNlInput] = React.useState('')
  const [showManual, setShowManual] = React.useState(false)
  const [customDate, setCustomDate] = React.useState('')
  const [isSaving, setIsSaving] = React.useState(false)

  const handleSnooze = async (until: Date) => {
    setIsSaving(true)
    try {
      await snoozeTicket(ticketId, until.toISOString())
      setOpen(false)
      setNlInput('')
      setCustomDate('')
      setShowManual(false)
      onComplete?.()
    } catch (error) {
      console.error('Error snoozing ticket:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleNlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsed = parseNaturalDate(nlInput)
    if (parsed && parsed > new Date()) {
      handleSnooze(parsed)
    }
  }

  const handleManualSnooze = () => {
    if (!customDate) return
    const date = new Date(customDate)
    if (isNaN(date.getTime()) || date <= new Date()) return
    handleSnooze(date)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children || (
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Clock className="h-3.5 w-3.5" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="end">
        <div className="space-y-3">
          {/* Natural language input */}
          <form onSubmit={handleNlSubmit}>
            <div className="relative">
              <Sparkles className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={nlInput}
                onChange={(e) => setNlInput(e.target.value)}
                placeholder="tomorrow at 9am, friday 10pm..."
                className="pl-8 h-8 text-xs"
                autoFocus
                disabled={isSaving}
              />
            </div>
          </form>

          {/* Quick pick chips */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_PICKS.map((pick) => (
              <button
                key={pick.label}
                onClick={() => handleSnooze(pick.getDate())}
                disabled={isSaving}
                className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-mono text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50"
              >
                {pick.label}
              </button>
            ))}
          </div>

          {/* Manual date picker (collapsible) */}
          <div>
            <button
              onClick={() => setShowManual(!showManual)}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              <ChevronRight className={`h-3 w-3 transition-transform ${showManual ? 'rotate-90' : ''}`} />
              Or pick date & time manually
            </button>

            {showManual && (
              <div className="mt-2 space-y-2 pl-4">
                <Input
                  type="datetime-local"
                  className="h-7 text-xs"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
                <Button
                  size="sm"
                  className="w-full h-6 text-[10px]"
                  onClick={handleManualSnooze}
                  disabled={!customDate || isSaving}
                >
                  Snooze
                </Button>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
