import { cn } from '@/lib/utils'

interface HorizontalConnectorProps {
  side: 'left' | 'right'
  width?: number
  className?: string
}

export function HorizontalConnector({ side, width = 65, className }: HorizontalConnectorProps) {
  const isLeft = side === 'left'
  return (
    <div
      className={cn('absolute top-1/2 flex -translate-y-1/2 items-center', isLeft ? 'flex-row' : 'flex-row-reverse', className)}
      style={isLeft ? { width, left: -width } : { width, right: -width }}
    >
      <span className={cn('size-1.5 shrink-0 rounded-full', 'bg-current')} />
      <span
        className={cn(
          'h-0 flex-1 border-t-2 border-dashed',
          isLeft ? 'ml-1' : 'mr-1'
        )}
      />
    </div>
  )
}
