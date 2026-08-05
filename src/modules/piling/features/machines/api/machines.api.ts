import { apiClient } from '@/lib/apiClient'
import type { CreateMachinePayload, Machine, UpdateMachinePayload } from '../types/machines.types'

interface RawMachineOut {
  id: string
  site_id: string
  machine_no: string
  type: Machine['type']
  status: Machine['status']
}

interface RawMachinesWithDeletions {
  items: RawMachineOut[]
  deleted_ids: string[]
}

function mapMachine(raw: RawMachineOut): Machine {
  return {
    id: raw.id,
    machineNo: raw.machine_no,
    type: raw.type,
    status: raw.status,
  }
}

async function getMachinesForSite(siteId: string): Promise<Machine[]> {
  const { data } = await apiClient.get<RawMachinesWithDeletions>(`/piling/sites/${siteId}/machines`)
  return data.items.map(mapMachine)
}

async function createMachine(siteId: string, payload: CreateMachinePayload): Promise<void> {
  await apiClient.post(`/piling/sites/${siteId}/machines`, {
    machine_no: payload.machineNo,
    type: payload.type,
    status: payload.status,
  })
}

async function updateMachine(machineId: string, payload: UpdateMachinePayload): Promise<void> {
  await apiClient.patch(`/piling/machines/${machineId}`, {
    machine_no: payload.machineNo,
    type: payload.type,
    status: payload.status,
  })
}

async function deleteMachine(machineId: string): Promise<void> {
  await apiClient.delete(`/piling/machines/${machineId}`)
}

export const machinesService = {
  getMachinesForSite,
  createMachine,
  updateMachine,
  deleteMachine,
}
