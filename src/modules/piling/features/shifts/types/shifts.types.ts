export type WindowBehavior = 'FIXED' | 'AFTER_CURRENT_STEP'

export interface NonWorkingWindow {
  id: string
  shiftTypeId: string
  label: string
  startTime: string
  endTime: string
  behavior: WindowBehavior
}

export interface ShiftType {
  id: string
  name: string
  startTime: string
  endTime: string
  windows: NonWorkingWindow[]
}

export interface CreateShiftPayload {
  name: string
  startTime: string
  endTime: string
}

export interface UpdateShiftPayload {
  name?: string
  startTime?: string
  endTime?: string
}

export interface CreateNonWorkingWindowPayload {
  shiftTypeId: string
  label: string
  startTime: string
  endTime: string
  behavior: WindowBehavior
}

export interface UpdateNonWorkingWindowPayload {
  label?: string
  startTime?: string
  endTime?: string
  behavior?: WindowBehavior
}
