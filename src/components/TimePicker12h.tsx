import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Period = 'AM' | 'PM'

const HOUR_ITEMS = Array.from({ length: 12 }, (_, i) => {
  const hour = i + 1
  return { value: String(hour), label: String(hour).padStart(2, '0') }
})

const MINUTE_ITEMS = Array.from({ length: 60 }, (_, i) => ({
  value: String(i),
  label: String(i).padStart(2, '0'),
}))

const PERIOD_ITEMS: { value: Period; label: string }[] = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
]

function parseValue(value: string): { hour12: number; minute: number; period: Period } {
  const [hStr, mStr] = value.split(':')
  const hour24 = Number(hStr) || 0
  const minute = Number(mStr) || 0
  const period: Period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return { hour12, minute, period }
}

function composeValue(hour12: number, minute: number, period: Period): string {
  const hour24 = period === 'PM' ? (hour12 % 12) + 12 : hour12 % 12
  return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

interface TimePicker12hProps {
  value: string
  onChange: (value: string) => void
  idPrefix: string
}

export function TimePicker12h({ value, onChange, idPrefix }: TimePicker12hProps) {
  const { hour12, minute, period } = parseValue(value)

  return (
    <div className="flex items-center gap-1.5">
      <Select
        value={String(hour12)}
        onValueChange={(v) => onChange(composeValue(Number(v), minute, period))}
        items={HOUR_ITEMS}
      >
        <SelectTrigger id={`${idPrefix}-hour`} size="sm" className="w-16">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          <SelectGroup>
            {HOUR_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <span className="text-muted-foreground">:</span>

      <Select
        value={String(minute)}
        onValueChange={(v) => onChange(composeValue(hour12, Number(v), period))}
        items={MINUTE_ITEMS}
      >
        <SelectTrigger id={`${idPrefix}-minute`} size="sm" className="w-16">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          <SelectGroup>
            {MINUTE_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>

      <Select
        value={period}
        onValueChange={(v) => onChange(composeValue(hour12, minute, v as Period))}
        items={PERIOD_ITEMS}
      >
        <SelectTrigger id={`${idPrefix}-period`} size="sm" className="w-[4.5rem]">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          <SelectGroup>
            {PERIOD_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
