export type PersonnelDesignation =
  | 'PROJECT_MANAGER'
  | 'PLANNING_ENGINEER'
  | 'SHIFT_INCHARGE'
  | 'ENGINEER'
  | 'SUPERVISOR'
  | 'RIG_OPERATOR'
  | 'CRANE_OPERATOR'
  | 'FOREMAN'

export const PERSONNEL_DESIGNATIONS: { value: PersonnelDesignation; label: string }[] = [
  { value: 'PROJECT_MANAGER', label: 'Project Manager' },
  { value: 'PLANNING_ENGINEER', label: 'Planning Engineer' },
  { value: 'SHIFT_INCHARGE', label: 'Shift Incharge' },
  { value: 'ENGINEER', label: 'Engineer' },
  { value: 'SUPERVISOR', label: 'Supervisor' },
  { value: 'RIG_OPERATOR', label: 'Rig Operator' },
  { value: 'CRANE_OPERATOR', label: 'Crane Operator' },
  { value: 'FOREMAN', label: 'Foreman' },
]

export function personnelDesignationLabel(value: PersonnelDesignation): string {
  return PERSONNEL_DESIGNATIONS.find((d) => d.value === value)?.label ?? value
}

export interface SitePersonnel {
  id: string
  name: string
  designation: PersonnelDesignation
  phone: string | null
  email: string | null
  employeeCode: string | null
  isActive: boolean
}

export interface CreatePersonnelPayload {
  name: string
  designation: PersonnelDesignation
  phone: string | null
  email: string | null
  employeeCode: string | null
  isActive: boolean
}

export interface UpdatePersonnelPayload {
  name?: string
  designation?: PersonnelDesignation
  phone?: string | null
  email?: string | null
  employeeCode?: string | null
  isActive?: boolean
}

// ─── Personnel import ───────────────────────────────────────────────────────

export interface PersonnelImportRowResult {
  rowNumber: number
  employeeCode: string | null
  name: string | null
  designation: PersonnelDesignation | null
  phone: string | null
  email: string | null
  isActive: boolean
  status: 'ok' | 'error'
  errors: string[]
}

export interface PersonnelImportPreview {
  total: number
  valid: number
  invalid: number
  rows: PersonnelImportRowResult[]
}

export interface PersonnelImportConfirmResult {
  created: number
  failedRows: PersonnelImportRowResult[]
}
