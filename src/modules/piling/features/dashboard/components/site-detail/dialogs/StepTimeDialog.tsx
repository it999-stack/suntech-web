import { useEffect, useState } from 'react'
import { CheckIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface StepTimeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stepName: string
  sequenceOrder: number
  totalSteps: number
  actualStart: Date | null
  actualEnd: Date | null
  onSave: (actualStart: Date | null, actualEnd: Date | null) => void
}

const hourItems = Array.from({ length: 12 }, (_, i) => {
  const value = String(i + 1)
  return { value, label: value }
})
const minuteItems = Array.from({ length: 60 }, (_, i) => {
  const value = String(i).padStart(2, '0')
  return { value, label: value }
})
const periodItems = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
]

function to12Hour(date: Date | null): { hour: string; minute: string; period: 'AM' | 'PM' } {
  if (!date) return { hour: '12', minute: '00', period: 'AM' }
  const h = date.getHours()
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 === 0 ? 12 : h % 12
  return { hour: String(hour12), minute: String(date.getMinutes()).padStart(2, '0'), period }
}

function applyTime(base: Date | null, hour: string, minute: string, period: 'AM' | 'PM'): Date {
  const next = base ? new Date(base) : new Date()
  let h = parseInt(hour, 10) % 12
  if (period === 'PM') h += 12
  next.setHours(h, parseInt(minute, 10), 0, 0)
  return next
}

function mergeDay(day: Date, previous: Date | null): Date {
  const next = new Date(day)
  const time = previous ?? new Date()
  next.setHours(time.getHours(), time.getMinutes(), 0, 0)
  return next
}

function formatDisplay(date: Date): string {
  const { hour, minute, period } = to12Hour(date)
  return `${hour}:${minute} ${period}`
}

export function StepTimeDialog({
  open,
  onOpenChange,
  stepName,
  sequenceOrder,
  totalSteps,
  actualStart,
  actualEnd,
  onSave,
}: StepTimeDialogProps) {
  const [start, setStart] = useState<Date | null>(actualStart)
  const [end, setEnd] = useState<Date | null>(actualEnd)
  const [activeField, setActiveField] = useState<'start' | 'end'>('start')

  useEffect(() => {
    if (open) {
      setStart(actualStart)
      setEnd(actualEnd)
      setActiveField('start')
    }
  }, [open, actualStart, actualEnd])

  const activeValue = activeField === 'start' ? start : end
  const setActiveValue = activeField === 'start' ? setStart : setEnd
  const { hour, minute, period } = to12Hour(activeValue)

  function updateTime(part: 'hour' | 'minute' | 'period', value: string) {
    const next = {
      hour: part === 'hour' ? value : hour,
      minute: part === 'minute' ? value : minute,
      period: part === 'period' ? (value as 'AM' | 'PM') : period,
    }
    setActiveValue(applyTime(activeValue, next.hour, next.minute, next.period))
  }

  function handleSetNow() {
    setActiveValue(new Date())
  }

  function handleSave() {
    onSave(start, end)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[340px] gap-4">
        <DialogHeader>
          <DialogTitle>{stepName}</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Step {sequenceOrder} of {totalSteps}
          </p>
        </DialogHeader>

        <div className="flex gap-2">
          <Button
            variant={activeField === 'start' ? 'default' : 'outline'}
            size="sm"
            className="flex-1 justify-between"
            onClick={() => setActiveField('start')}
          >
            <span>Start</span>
            <span className="flex items-center gap-1 font-normal">
              {start && <CheckIcon className="size-3" />}
              {start ? formatDisplay(start) : '—'}
            </span>
          </Button>
          <Button
            variant={activeField === 'end' ? 'default' : 'outline'}
            size="sm"
            className="flex-1 justify-between"
            onClick={() => setActiveField('end')}
          >
            <span>End</span>
            <span className="flex items-center gap-1 font-normal">
              {end && <CheckIcon className="size-3" />}
              {end ? formatDisplay(end) : '—'}
            </span>
          </Button>
        </div>

        <Calendar
            mode="single"
            selected={activeValue ?? undefined}
            onSelect={(day) => day && setActiveValue(mergeDay(day, activeValue))}
            className="w-full"
            classNames={{
                month: 'w-full',
                month_grid: 'w-full border-collapse',
                weekdays: 'flex w-full justify-between',
                weekday: 'flex-1 text-center',
                week: 'flex w-full justify-between mt-1',
                day: 'flex-1 text-center',
                day_button: 'w-full',
            }}
        />

        <div className="flex items-center gap-2">
          <Select value={hour} onValueChange={(v) => v && updateTime('hour', v)} items={hourItems}>
            <SelectTrigger size="sm" className="w-16">
              <SelectValue placeholder="12" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {hourItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <span className="text-muted-foreground">:</span>

          <Select value={minute} onValueChange={(v) => v && updateTime('minute', v)} items={minuteItems}>
            <SelectTrigger size="sm" className="w-16">
              <SelectValue placeholder="00" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {minuteItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Select value={period} onValueChange={(v) => v && updateTime('period', v)} items={periodItems}>
            <SelectTrigger size="sm" className="w-18">
              <SelectValue placeholder="AM" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {periodItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="ml-auto" onClick={handleSetNow}>
            Now
          </Button>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button onClick={handleSave} disabled={!start}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}