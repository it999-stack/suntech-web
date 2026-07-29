import { stepStatusVisuals } from './stepStatusVisuals'
import { StatusPill } from './StatusPill'

export function StepStatusLegend() {
  return (
    <div className="flex flex-col items-start gap-1.5">
      {Object.keys(stepStatusVisuals).map((kind) => (
        <StatusPill key={kind} kind={kind as keyof typeof stepStatusVisuals} />
      ))}
    </div>
  )
}
