import { cn } from '@/lib/utils'

interface ConnectorLineProps {
  solid: boolean
  invisible?: boolean
  orientation?: 'vertical' | 'horizontal'
  className?: string
}

// A single segment of a connecting line between nodes on a rail/stepper —
// solid when the segment has been "passed", dashed otherwise, or fully
// invisible (still occupies layout space) for the outermost segments.
export function ConnectorLine({ solid, invisible, orientation = 'vertical', className }: ConnectorLineProps) {
  const isVertical = orientation === 'vertical'

  if (invisible) {
    return <div className={cn(isVertical ? 'w-0.5 flex-1' : 'h-0.5 flex-1', className)} />
  }

  if (solid) {
    return <div className={cn(isVertical ? 'w-0.5 flex-1 bg-foreground' : 'h-0.5 flex-1 bg-foreground', className)} />
  }

  return (
    <div
      className={cn(
        isVertical
          ? 'w-0 flex-1 border-l-2 border-dashed border-border'
          : 'h-0 flex-1 border-t-2 border-dashed border-border',
        className
      )}
    />
  )
}
