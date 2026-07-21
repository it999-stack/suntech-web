import { Progress as ProgressPrimitive } from '@base-ui/react/progress'
import { ProgressTrack, ProgressIndicator } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ProgressBarProps {
  value: number
  size?: 'default' | 'sm'
  label?: string
  className?: string
}

export function ProgressBar({ value, size = 'default', label, className }: ProgressBarProps) {
  return (
    <ProgressPrimitive.Root value={value} className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="font-medium tabular-nums text-foreground">{Math.round(value)}%</span>
        </div>
      )}
      <ProgressTrack className={size === 'sm' ? 'h-1.5' : 'h-2.5'}>
        <ProgressIndicator />
      </ProgressTrack>
    </ProgressPrimitive.Root>
  )
}
