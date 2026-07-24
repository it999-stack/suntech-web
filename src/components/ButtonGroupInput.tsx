import { SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { Input } from "@/components/ui/input"

interface ButtonGroupInputProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  inputClassName?: string
  "aria-label"?: string
}

export function ButtonGroupInput({
  value,
  onValueChange,
  placeholder = "Search...",
  className,
  inputClassName,
  "aria-label": ariaLabel = "Search",
}: ButtonGroupInputProps) {
  return (
    <ButtonGroup className={className}>
      <Input
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        placeholder={placeholder}
        className={inputClassName}
      />
      <Button variant="outline" size="icon" aria-label={ariaLabel}>
        <SearchIcon />
      </Button>
    </ButtonGroup>
  )
}
