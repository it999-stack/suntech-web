import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import type { DateRange } from 'react-day-picker'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { dateOnly, parseDateStr } from '@/lib/date'

interface DateRangePickerProps {
  from: string // yyyy-MM-dd
  to: string // yyyy-MM-dd
  onChange: (range: { from: string; to: string }) => void
  align?: 'start' | 'center' | 'end'
  className?: string
}

export function DateRangePicker({ from, to, onChange, align = 'end', className }: DateRangePickerProps) {
  const selectedRange: DateRange = { from: parseDateStr(from), to: parseDateStr(to) }
  const isSingleDay = from === to
  const dateLabel = isSingleDay
    ? format(selectedRange.from!, 'd MMM yyyy')
    : `${format(selectedRange.from!, 'd MMM')} – ${format(selectedRange.to!, 'd MMM yyyy')}`

  return (
    <Popover>
      <PopoverTrigger render={<Button variant="outline" size="sm" className={className ?? 'gap-2 font-normal'} />}>
        <CalendarIcon className="size-4 text-muted-foreground" />
        {dateLabel}
      </PopoverTrigger>
      <PopoverContent align={align} className="w-auto p-2">
        <Calendar
          mode="range"
          numberOfMonths={2}
          selected={selectedRange}
          onSelect={(picked) =>
            picked?.from && onChange({ from: dateOnly(picked.from), to: dateOnly(picked.to ?? picked.from) })
          }
        />
      </PopoverContent>
    </Popover>
  )
}
