import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { PileMeasurements } from '../types/dashboard.types'

export interface PileMeasurementsUpdate {
  eglM?: number | null
  pileContractorId?: string | null
  cageContractorId?: string | null
  pileLengthM?: number | null
  cageWeightKg?: number | null
  ctlM?: number | null
  colM?: number | null
  boreDepthM?: number | null
  hookLengthM?: number | null
  flM?: number | null
  plannedQtyM3?: number | null
  actualQtyM3?: number | null
}

interface RawContractorSummary {
  id: string
  name: string
}

interface RawPileMeasurementsOut {
  egl_m: number | null
  pile_contractor_id: string | null
  pile_contractor: RawContractorSummary | null
  cage_contractor_id: string | null
  cage_contractor: RawContractorSummary | null
  pile_length_m: number | null
  cage_weight_kg: number | null
  ctl_m: number | null
  col_m: number | null
  bore_depth_m: number | null
  hook_length_m: number | null
  fl_m: number | null
  planned_qty_m3: number | null
  actual_qty_m3: number | null
}

interface UpdatePileMeasurementsVars {
  pileId: string
  update: PileMeasurementsUpdate
}

function toPayload(update: PileMeasurementsUpdate) {
  return {
    egl_m: update.eglM,
    pile_contractor_id: update.pileContractorId,
    cage_contractor_id: update.cageContractorId,
    pile_length_m: update.pileLengthM,
    cage_weight_kg: update.cageWeightKg,
    ctl_m: update.ctlM,
    col_m: update.colM,
    bore_depth_m: update.boreDepthM,
    hook_length_m: update.hookLengthM,
    fl_m: update.flM,
    planned_qty_m3: update.plannedQtyM3,
    actual_qty_m3: update.actualQtyM3,
  }
}

function mapMeasurements(raw: RawPileMeasurementsOut): PileMeasurements {
  return {
    eglM: raw.egl_m,
    pileContractorId: raw.pile_contractor_id,
    pileContractor: raw.pile_contractor,
    cageContractorId: raw.cage_contractor_id,
    cageContractor: raw.cage_contractor,
    pileLengthM: raw.pile_length_m,
    cageWeightKg: raw.cage_weight_kg,
    ctlM: raw.ctl_m,
    colM: raw.col_m,
    boreDepthM: raw.bore_depth_m,
    hookLengthM: raw.hook_length_m,
    flM: raw.fl_m,
    plannedQtyM3: raw.planned_qty_m3,
    actualQtyM3: raw.actual_qty_m3,
  }
}

// Piles are keyed by pile_id (not checklist_pile_id) — one row per physical
// pile. Unlike the range table's other mutations, this can be reached from
// more than one view (range table, single-day checklist table) each backed
// by a different query — so, like useUpdateActualSteps, invalidation is left
// to the caller (see each PileDetailSheet call site's onMeasurementsSaved).
export function useUpdatePileMeasurements() {
  return useMutation({
    mutationFn: async ({ pileId, update }: UpdatePileMeasurementsVars) => {
      const { data } = await apiClient.patch<RawPileMeasurementsOut>(
        `/piling/piles/${pileId}/measurements`,
        toPayload(update)
      )
      return mapMeasurements(data)
    },
  })
}
