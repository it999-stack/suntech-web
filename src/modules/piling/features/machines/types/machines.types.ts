export type MachineType = 'RIG' | 'CRANE' | 'COMPRESSOR'
export type MachineStatus = 'ACTIVE' | 'INACTIVE' | 'BREAKDOWN'

export interface Machine {
  id: string
  machineNo: string
  type: MachineType
  status: MachineStatus
}

export interface CreateMachinePayload {
  machineNo: string
  type: MachineType
  status: MachineStatus
}

export interface UpdateMachinePayload {
  machineNo?: string
  type?: MachineType
  status?: MachineStatus
}
