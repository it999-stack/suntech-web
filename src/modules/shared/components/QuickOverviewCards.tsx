import type { ReactNode } from 'react'
import { CardTitle, CardDescription } from '@/components/ui/card'
import { KpiCard, type KpiCardVariant } from '@/modules/shared/components/KpiCard'
import { cn } from '@/lib/utils'

export interface QuickOverviewItem {
  label: string
  value: string | number
  subValue?: string // e.g. "420 New" — rendered muted, next to the value
  icon: ReactNode // required — pass it explicitly at the call site, no guessing from label text
  variant?: KpiCardVariant
}

interface QuickOverviewCardProps {
  title: string
  description: string
  items: QuickOverviewItem[]
  backgroundImage?: string
  className?: string
}

const glassCardClass = cn(
  'border-white/65 bg-white/85 backdrop-blur-md shadow-none',
  'dark:border-white/10 dark:bg-white/5'
)

export function QuickOverviewCard({
  title,
  description,
  items,
  backgroundImage,
  className,
}: QuickOverviewCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/60 bg-white/60 p-6 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)] backdrop-blur-xl',
        'dark:border-white/10 dark:bg-slate-900/50',
        className
      )}
    >
      {backgroundImage ? (
        <img
          src={backgroundImage}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-60"
        />
      ) : (
        <>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-20 h-72 w-72 rounded-full opacity-70 blur-2xl"
            style={{ background: 'radial-gradient(circle, var(--color-primary) 0%, transparent 70%)' }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-32 top-4 h-56 w-56 rounded-full opacity-60 blur-2xl"
            style={{ background: 'radial-gradient(circle, var(--color-accent) 0%, transparent 70%)' }}
          />
        </>
      )}

      <div className="relative mb-5">
        <CardTitle>{title}</CardTitle>
        <CardDescription className="mt-1">{description}</CardDescription>
      </div>

      <div className="relative grid grid-cols-2 gap-3 md:grid-cols-4">
        {items.map((item) => (
          <KpiCard
            key={item.label}
            label={item.label}
            value={item.subValue ? `${item.value} (${item.subValue})` : item.value}
            icon={item.icon}
            variant={item.variant}
            className={glassCardClass}
          />
        ))}
      </div>
    </div>
  )
}