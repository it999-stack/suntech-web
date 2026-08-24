import { useState } from 'react'
import { ChevronDownIcon, SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

export interface MultiSelectOption {
  value: string
  label: string
}

interface MachineMultiSelectFilterProps {
  options: MultiSelectOption[]
  // Empty array means "no filter" (every option counts as selected) — mirrors
  // the single-select ALL sentinel this replaced.
  selected: string[]
  onApply: (values: string[]) => void
  allLabel?: string
  className?: string
}

// Selection is staged locally (`draft`) while the popover is open and only
// committed via onApply — reopening always re-seeds the draft from the last
// committed `selected`, so an outside click/Escape discards in-progress
// changes instead of applying them.
export function MachineMultiSelectFilter({
  options,
  selected,
  onApply,
  allLabel = 'All Machines',
  className,
}: MachineMultiSelectFilterProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<string[]>(selected)

  function handleOpenChange(next: boolean) {
    if (next) {
      setDraft(selected)
      setSearch('')
    }
    setOpen(next)
  }

  const filteredOptions = options.filter((o) => o.label.toLowerCase().includes(search.trim().toLowerCase()))
  const filteredValues = filteredOptions.map((o) => o.value)
  const allFilteredSelected = filteredValues.length > 0 && filteredValues.every((v) => draft.includes(v))
  const someFilteredSelected = !allFilteredSelected && filteredValues.some((v) => draft.includes(v))

  function toggleValue(value: string) {
    setDraft((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  function toggleSelectAll() {
    setDraft((prev) => {
      if (allFilteredSelected) return prev.filter((v) => !filteredValues.includes(v))
      const merged = new Set(prev)
      filteredValues.forEach((v) => merged.add(v))
      return Array.from(merged)
    })
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger render={<Button variant="outline" size="sm" className={cn('gap-2 font-normal', className)} />}>
        <span className="truncate">{selected.length === 0 ? allLabel : `${allLabel} (${selected.length} selected)`}</span>
        <ChevronDownIcon className="size-3.5 text-muted-foreground" />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-64 gap-0 p-0">
        <div className="p-2">
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search machines..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </InputGroup>
        </div>

        <div className="flex items-center justify-between gap-2 border-y px-3 py-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
            <Checkbox
              checked={allFilteredSelected}
              indeterminate={someFilteredSelected}
              onCheckedChange={toggleSelectAll}
              disabled={filteredValues.length === 0}
            />
            Select all
          </label>
          <span className="shrink-0 text-xs text-muted-foreground">
            {draft.length} of {options.length} selected
          </span>
        </div>

        <div className="max-h-60 overflow-y-auto p-1">
          {filteredOptions.length === 0 ? (
            <p className="px-2 py-4 text-center text-sm text-muted-foreground">No machines found</p>
          ) : (
            filteredOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Checkbox checked={draft.includes(option.value)} onCheckedChange={() => toggleValue(option.value)} />
                {option.label}
              </label>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t p-2">
          <Button variant="ghost" size="sm" onClick={() => setDraft([])}>
            Clear
          </Button>
          <Button
            size="sm"
            onClick={() => {
              onApply(draft)
              setOpen(false)
            }}
          >
            Apply ({draft.length})
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
