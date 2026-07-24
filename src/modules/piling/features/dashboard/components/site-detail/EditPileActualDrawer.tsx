import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from '@/components/ui/field'
import { useUpdateActualSteps, type ActualStepUpdate } from '../../hooks/useUpdateActualSteps'
import type { ChecklistStepRow } from '../../types/dashboard.types'
import { StepTimeDialog } from './dialogs/StepTimeDialog'
import { byNumber } from '@/lib/sort'
import { getErrorMessage } from '@/lib/errors'
import { formatTime } from '@/lib/date'

interface EditPileActualDrawerProps {
  rows: ChecklistStepRow[]
  pileIdCode: string
  checklistId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

type FormState = Record<string, { actualStart: Date | null; actualEnd: Date | null }>

function parseIso(iso: string | null): Date | null {
  return iso ? new Date(iso) : null
}

function buildInitialState(rows: ChecklistStepRow[]): FormState {
  const state: FormState = {}
  for (const row of rows) {
    state[row.stepId] = { actualStart: parseIso(row.actualStart), actualEnd: parseIso(row.actualEnd) }
  }
  return state
}

function stepDescription(entry: { actualStart: Date | null; actualEnd: Date | null } | undefined): string {
  if (!entry?.actualStart) return 'Not started'
  const start = formatTime(entry.actualStart.toISOString())
  const end = entry.actualEnd ? formatTime(entry.actualEnd.toISOString()) : 'In progress'
  return `${start} – ${end}`
}

export function EditPileActualDrawer({ rows, pileIdCode, checklistId, open, onOpenChange }: EditPileActualDrawerProps) {
  const [form, setForm] = useState<FormState>({})
  const [editingStepId, setEditingStepId] = useState<string | null>(null)
  const updateActualSteps = useUpdateActualSteps(checklistId)

  useEffect(() => {
    if (open) setForm(buildInitialState(rows))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, rows])

  const sortedRows = [...rows].sort(byNumber((row) => row.sequenceOrder))
  const checklistPileId = rows[0]?.checklistPileId
  const editingRow = sortedRows.find((row) => row.stepId === editingStepId) ?? null

  function handleStepSave(stepId: string, actualStart: Date | null, actualEnd: Date | null) {
    setForm((prev) => ({ ...prev, [stepId]: { actualStart, actualEnd } }))
  }

  function handleSave() {
    if (!checklistPileId) return
    const entries: ActualStepUpdate[] = sortedRows.map((row) => ({
      stepId: row.stepId,
      actualStart: form[row.stepId]?.actualStart ?? null,
      actualEnd: form[row.stepId]?.actualEnd ?? null,
    }))

    updateActualSteps.mutate(
      { checklistPileId, entries },
      {
        onSuccess: () => onOpenChange(false),
        onError: (error) => toast.error(getErrorMessage(error, 'Failed to save actual times')),
      }
    )
  }

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="right">
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit actual times — {pileIdCode}</DrawerTitle>
            <DrawerDescription>Tap a step to set its actual start and end time.</DrawerDescription>
          </DrawerHeader>

          <div className="flex-1 scroll-fade overflow-y-auto p-4">
            <div className="flex flex-col gap-2">
              {sortedRows.map((row) => {
                const entry = form[row.stepId]
                const isDone = !!entry?.actualStart && !!entry?.actualEnd
                return (
                  <FieldLabel key={row.stepId} onClick={() => setEditingStepId(row.stepId)}>
                    <Field orientation="horizontal" className="cursor-pointer">
                      <FieldContent>
                        <FieldTitle className="flex items-center gap-2">
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold">
                            {row.sequenceOrder}
                          </span>
                          {row.stepName}
                          {isDone && <Badge variant="secondary">Done</Badge>}
                        </FieldTitle>
                        <FieldDescription>{stepDescription(entry)}</FieldDescription>
                      </FieldContent>
                    </Field>
                  </FieldLabel>
                )
              })}
            </div>
          </div>

          <DrawerFooter>
            <Button onClick={handleSave} disabled={updateActualSteps.isPending} className="h-[34px]">
              {updateActualSteps.isPending ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {editingRow && (
        <StepTimeDialog
          open={!!editingStepId}
          onOpenChange={(o) => !o && setEditingStepId(null)}
          stepName={editingRow.stepName}
          sequenceOrder={editingRow.sequenceOrder}
          totalSteps={sortedRows.length}
          actualStart={form[editingRow.stepId]?.actualStart ?? null}
          actualEnd={form[editingRow.stepId]?.actualEnd ?? null}
          onSave={(start, end) => handleStepSave(editingRow.stepId, start, end)}
        />
      )}
    </>
  )
}