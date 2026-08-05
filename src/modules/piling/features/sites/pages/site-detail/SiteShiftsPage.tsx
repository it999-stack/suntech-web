import { useState } from 'react'
import { ClockIcon, PencilLine, PlusIcon, Trash2Icon } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { EmptyState } from '@/components/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatTime12h } from '@/lib/date'
import { DeleteNonWorkingWindowDialog } from '../../../shifts/components/DeleteNonWorkingWindowDialog'
import { DeleteShiftDialog } from '../../../shifts/components/DeleteShiftDialog'
import { NonWorkingWindowFormDialog } from '../../../shifts/components/NonWorkingWindowFormDialog'
import { ShiftFormDialog } from '../../../shifts/components/ShiftFormDialog'
import { useSiteShifts } from '../../../shifts/hooks/useShifts'
import type { NonWorkingWindow, ShiftType } from '../../../shifts/types/shifts.types'

const behaviorLabel: Record<NonWorkingWindow['behavior'], string> = {
  FIXED: 'Fixed',
  AFTER_CURRENT_STEP: 'After Current Step',
}

export default function SiteShiftsPage() {
  const { siteId } = useParams<{ siteId: string }>()

  const [createShiftOpen, setCreateShiftOpen] = useState(false)
  const [shiftToEdit, setShiftToEdit] = useState<ShiftType | null>(null)
  const [shiftToDelete, setShiftToDelete] = useState<ShiftType | null>(null)

  const [createWindowOpen, setCreateWindowOpen] = useState(false)
  const [windowToEdit, setWindowToEdit] = useState<NonWorkingWindow | null>(null)
  const [windowToDelete, setWindowToDelete] = useState<NonWorkingWindow | null>(null)

  const shiftsQuery = useSiteShifts(siteId)
  const shifts = shiftsQuery.data ?? []
  const windows = shifts.flatMap((shift) => shift.windows)

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Shifts</CardTitle>

          <CardAction>
            <Button onClick={() => setCreateShiftOpen(true)}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Shift
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          {shiftsQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : shifts.length === 0 ? (
            <EmptyState
              icon={ClockIcon}
              title="No shifts configured yet"
              description="Click Add Shift to configure a shift's start and end time for this site."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {shifts.map((shift) => (
                <Card key={shift.id} className="gap-2 py-4">
                  <CardHeader className="px-4">
                    <CardTitle className="text-sm">{shift.name}</CardTitle>

                    <CardAction className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => setShiftToEdit(shift)}>
                        <PencilLine className="text-muted-foreground" />
                        <span className="sr-only">Edit {shift.name}</span>
                      </Button>

                      <Button variant="ghost" size="icon-xs" onClick={() => setShiftToDelete(shift)}>
                        <Trash2Icon className="text-destructive" />
                        <span className="sr-only">Delete {shift.name}</span>
                      </Button>
                    </CardAction>
                  </CardHeader>

                  <CardContent className="px-4 text-sm text-muted-foreground">
                    {formatTime12h(shift.startTime)} – {formatTime12h(shift.endTime)}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Non-Working Windows</CardTitle>

          <CardAction>
            <Button onClick={() => setCreateWindowOpen(true)} disabled={shifts.length === 0}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Window
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent>
          {shiftsQuery.isLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 rounded-lg" />
              ))}
            </div>
          ) : windows.length === 0 ? (
            <EmptyState
              icon={ClockIcon}
              title="No non-working windows yet"
              description={
                shifts.length === 0
                  ? 'Add a shift first, then configure its non-working windows here.'
                  : 'Click Add Window to configure a break or non-working period.'
              }
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {windows.map((window) => (
                <Card key={window.id} className="gap-2 py-4">
                  <CardHeader className="px-4">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm">{window.label}</CardTitle>
                      <Badge variant="outline">{behaviorLabel[window.behavior]}</Badge>
                    </div>

                    <CardAction className="flex items-center gap-1">
                      <Button variant="ghost" size="icon-xs" onClick={() => setWindowToEdit(window)}>
                        <PencilLine className="text-muted-foreground" />
                        <span className="sr-only">Edit {window.label}</span>
                      </Button>

                      <Button variant="ghost" size="icon-xs" onClick={() => setWindowToDelete(window)}>
                        <Trash2Icon className="text-destructive" />
                        <span className="sr-only">Delete {window.label}</span>
                      </Button>
                    </CardAction>
                  </CardHeader>

                  <CardContent className="px-4 text-sm text-muted-foreground">
                    {formatTime12h(window.startTime)} – {formatTime12h(window.endTime)}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {siteId && (
        <ShiftFormDialog
          key={String(createShiftOpen)}
          mode="create"
          siteId={siteId}
          open={createShiftOpen}
          onOpenChange={setCreateShiftOpen}
        />
      )}

      {siteId && (
        <ShiftFormDialog
          key={shiftToEdit?.id}
          mode="edit"
          siteId={siteId}
          shift={shiftToEdit}
          open={shiftToEdit !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setShiftToEdit(null)
          }}
        />
      )}

      {siteId && (
        <DeleteShiftDialog
          siteId={siteId}
          shift={shiftToDelete}
          open={shiftToDelete !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setShiftToDelete(null)
          }}
        />
      )}

      {siteId && (
        <NonWorkingWindowFormDialog
          key={String(createWindowOpen)}
          mode="create"
          siteId={siteId}
          shifts={shifts}
          open={createWindowOpen}
          onOpenChange={setCreateWindowOpen}
        />
      )}

      {siteId && (
        <NonWorkingWindowFormDialog
          key={windowToEdit?.id}
          mode="edit"
          siteId={siteId}
          shifts={shifts}
          window={windowToEdit}
          open={windowToEdit !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setWindowToEdit(null)
          }}
        />
      )}

      {siteId && (
        <DeleteNonWorkingWindowDialog
          siteId={siteId}
          window={windowToDelete}
          open={windowToDelete !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setWindowToDelete(null)
          }}
        />
      )}
    </>
  )
}
