import { apiClient } from '@/lib/apiClient'
import type {
  CreateNonWorkingWindowPayload,
  CreateShiftPayload,
  NonWorkingWindow,
  ShiftType,
  UpdateNonWorkingWindowPayload,
  UpdateShiftPayload,
  WindowBehavior,
} from '../types/shifts.types'

interface RawNonWorkingWindowOut {
  id: string
  label: string
  start_time: string
  end_time: string
  behavior: WindowBehavior
}

interface RawShiftTypeOut {
  id: string
  site_id: string
  name: string
  start_time: string
  end_time: string
  windows: RawNonWorkingWindowOut[]
}

function mapWindow(raw: RawNonWorkingWindowOut, shiftTypeId: string): NonWorkingWindow {
  return {
    id: raw.id,
    shiftTypeId,
    label: raw.label,
    startTime: raw.start_time,
    endTime: raw.end_time,
    behavior: raw.behavior,
  }
}

function mapShiftType(raw: RawShiftTypeOut): ShiftType {
  return {
    id: raw.id,
    name: raw.name,
    startTime: raw.start_time,
    endTime: raw.end_time,
    windows: raw.windows.map((w) => mapWindow(w, raw.id)),
  }
}

async function getShiftsForSite(siteId: string): Promise<ShiftType[]> {
  const { data } = await apiClient.get<RawShiftTypeOut[]>(`/piling/sites/${siteId}/shifts`)
  return data.map(mapShiftType)
}

async function createShift(siteId: string, payload: CreateShiftPayload): Promise<void> {
  await apiClient.post(`/piling/sites/${siteId}/shifts`, {
    name: payload.name,
    start_time: payload.startTime,
    end_time: payload.endTime,
  })
}

async function updateShift(shiftId: string, payload: UpdateShiftPayload): Promise<void> {
  await apiClient.patch(`/piling/shifts/${shiftId}`, {
    name: payload.name,
    start_time: payload.startTime,
    end_time: payload.endTime,
  })
}

async function deleteShift(shiftId: string): Promise<void> {
  await apiClient.delete(`/piling/shifts/${shiftId}`)
}

async function createWindow(payload: CreateNonWorkingWindowPayload): Promise<void> {
  await apiClient.post(`/piling/shifts/${payload.shiftTypeId}/non-working-windows`, {
    label: payload.label,
    start_time: payload.startTime,
    end_time: payload.endTime,
    behavior: payload.behavior,
  })
}

async function updateWindow(windowId: string, payload: UpdateNonWorkingWindowPayload): Promise<void> {
  await apiClient.patch(`/piling/non-working-windows/${windowId}`, {
    label: payload.label,
    start_time: payload.startTime,
    end_time: payload.endTime,
    behavior: payload.behavior,
  })
}

async function deleteWindow(windowId: string): Promise<void> {
  await apiClient.delete(`/piling/non-working-windows/${windowId}`)
}

export const shiftsService = {
  getShiftsForSite,
  createShift,
  updateShift,
  deleteShift,
  createWindow,
  updateWindow,
  deleteWindow,
}
