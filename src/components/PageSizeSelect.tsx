import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface PageSizeSelectProps {
  value: number
  onValueChange: (value: number) => void
  options?: number[]
  className?: string
}

const DEFAULT_OPTIONS = [20, 30, 50]

export function PageSizeSelect({ value, onValueChange, options = DEFAULT_OPTIONS, className }: PageSizeSelectProps) {
  const items = options.map((option) => ({ value: String(option), label: String(option) }))

  return (
    <Select
      value={String(value)}
      onValueChange={(next) => onValueChange(Number(next ?? options[0]))}
      items={items}
    >
      <SelectTrigger size="sm" className={className ?? 'w-28'}>
        <SelectValue placeholder={`${options[0]} / page`} />
      </SelectTrigger>

      <SelectContent>
        <SelectGroup>
          {items.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
