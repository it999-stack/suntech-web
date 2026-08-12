import { apiClient } from '@/lib/apiClient'
import type {
  CreatePersonnelPayload,
  PersonnelDesignation,
  PersonnelImportConfirmResult,
  PersonnelImportPreview,
  PersonnelImportRowResult,
  SitePersonnel,
  UpdatePersonnelPayload,
} from '../types/personnel.types'

interface RawPersonnelOut {
  id: string
  site_id: string
  name: string
  designation: PersonnelDesignation
  phone: string | null
  email: string | null
  employee_code: string | null
  is_active: boolean
}

interface RawPersonnelWithDeletions {
  items: RawPersonnelOut[]
  deleted_ids: string[]
}

function mapPersonnel(raw: RawPersonnelOut): SitePersonnel {
  return {
    id: raw.id,
    name: raw.name,
    designation: raw.designation,
    phone: raw.phone,
    email: raw.email,
    employeeCode: raw.employee_code,
    isActive: raw.is_active,
  }
}

async function getPersonnelForSite(siteId: string): Promise<SitePersonnel[]> {
  const { data } = await apiClient.get<RawPersonnelWithDeletions>(`/piling/sites/${siteId}/personnel`)
  return data.items.map(mapPersonnel)
}

async function createPersonnel(siteId: string, payload: CreatePersonnelPayload): Promise<void> {
  await apiClient.post(`/piling/sites/${siteId}/personnel`, {
    name: payload.name,
    designation: payload.designation,
    phone: payload.phone,
    email: payload.email,
    employee_code: payload.employeeCode,
    is_active: payload.isActive,
  })
}

async function updatePersonnel(personnelId: string, payload: UpdatePersonnelPayload): Promise<void> {
  await apiClient.patch(`/piling/personnel/${personnelId}`, {
    name: payload.name,
    designation: payload.designation,
    phone: payload.phone,
    email: payload.email,
    employee_code: payload.employeeCode,
    is_active: payload.isActive,
  })
}

async function deletePersonnel(personnelId: string): Promise<void> {
  await apiClient.delete(`/piling/personnel/${personnelId}`)
}

interface RawPersonnelImportRowResult {
  row_number: number
  employee_code: string | null
  name: string | null
  designation: PersonnelDesignation | null
  phone: string | null
  email: string | null
  is_active: boolean
  status: 'ok' | 'error'
  errors: string[]
}

function mapImportRow(raw: RawPersonnelImportRowResult): PersonnelImportRowResult {
  return {
    rowNumber: raw.row_number,
    employeeCode: raw.employee_code,
    name: raw.name,
    designation: raw.designation,
    phone: raw.phone,
    email: raw.email,
    isActive: raw.is_active,
    status: raw.status,
    errors: raw.errors,
  }
}

async function previewPersonnelImport(siteId: string, file: File): Promise<PersonnelImportPreview> {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await apiClient.post<{
    total: number
    valid: number
    invalid: number
    rows: RawPersonnelImportRowResult[]
  }>(`/piling/sites/${siteId}/personnel/import/preview`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })

  return { total: data.total, valid: data.valid, invalid: data.invalid, rows: data.rows.map(mapImportRow) }
}

async function confirmPersonnelImport(
  siteId: string,
  rows: PersonnelImportRowResult[]
): Promise<PersonnelImportConfirmResult> {
  const { data } = await apiClient.post<{ created: number; failed_rows: RawPersonnelImportRowResult[] }>(
    `/piling/sites/${siteId}/personnel/import/confirm`,
    {
      rows: rows.map((row) => ({
        row_number: row.rowNumber,
        employee_code: row.employeeCode,
        name: row.name,
        designation: row.designation,
        phone: row.phone,
        email: row.email,
        is_active: row.isActive,
      })),
    }
  )

  return { created: data.created, failedRows: data.failed_rows.map(mapImportRow) }
}

async function downloadPersonnelImportTemplate(siteId: string): Promise<void> {
  const { data } = await apiClient.get(`/piling/sites/${siteId}/personnel/import/template`, {
    responseType: 'blob',
  })
  const url = URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = 'personnel_import_template.xlsx'
  link.click()
  URL.revokeObjectURL(url)
}

export const personnelService = {
  getPersonnelForSite,
  createPersonnel,
  updatePersonnel,
  deletePersonnel,
  previewPersonnelImport,
  confirmPersonnelImport,
  downloadPersonnelImportTemplate,
}
