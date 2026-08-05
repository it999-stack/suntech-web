export interface SitePersonnel {
  id: string
  name: string
  designation: string
  phone: string | null
  email: string | null
  employeeCode: string | null
  isActive: boolean
}

export interface CreatePersonnelPayload {
  name: string
  designation: string
  phone: string | null
  email: string | null
  employeeCode: string | null
  isActive: boolean
}

export interface UpdatePersonnelPayload {
  name?: string
  designation?: string
  phone?: string | null
  email?: string | null
  employeeCode?: string | null
  isActive?: boolean
}
