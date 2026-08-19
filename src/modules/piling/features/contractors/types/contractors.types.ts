export interface Contractor {
  id: string
  name: string
  isActive: boolean
}

export interface CreateContractorPayload {
  name: string
  isActive: boolean
}

export interface UpdateContractorPayload {
  name?: string
  isActive?: boolean
}
