import { ListChecksIcon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EmptyState } from '@/components/EmptyState'
import type { ChecklistStepRow, StepStatus } from '../types/dashboard.types'

interface StepStatusTableProps {
  rows: ChecklistStepRow[]
}

const statusLabel: Record<StepStatus, string> = {
  pending: 'Pending',
  in_progress: 'In progress',
  completed: 'Completed',
  delayed: 'Delayed',
}

const statusVariant: Record<StepStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending: 'outline',
  in_progress: 'secondary',
  completed: 'default',
  delayed: 'destructive',
}

function formatTime(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

export function StepStatusTable({ rows }: StepStatusTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Step Status</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <EmptyState
            icon={ListChecksIcon}
            title="No plan for this date"
            description="No checklist has been generated for this site on the selected date."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pile</TableHead>
                <TableHead>Step</TableHead>
                <TableHead>Track</TableHead>
                <TableHead>Planned Start</TableHead>
                <TableHead>Planned End</TableHead>
                <TableHead>Actual Start</TableHead>
                <TableHead>Actual End</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={`${row.checklistPileId}-${row.stepId}`}>
                  <TableCell className="font-medium text-foreground">{row.pileIdCode}</TableCell>
                  <TableCell>{row.stepName}</TableCell>
                  <TableCell className="text-muted-foreground">{row.track}</TableCell>
                  <TableCell>{formatTime(row.plannedStart)}</TableCell>
                  <TableCell>{formatTime(row.plannedEnd)}</TableCell>
                  <TableCell>{formatTime(row.actualStart)}</TableCell>
                  <TableCell>{formatTime(row.actualEnd)}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[row.status]}>{statusLabel[row.status]}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
