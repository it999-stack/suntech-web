import { useState } from 'react'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { SiteFormDialog } from '../components/SiteFormDialog'
import { SitesTable } from '../components/SitesTable'
import { useSites } from '../hooks/useSites'
import type { SiteListItem } from '../types/sites.types'

export default function SitesPage() {
  const sitesQuery = useSites()
  const [mode, setMode] = useState<'create' | 'edit'>('edit')
  const [editingSite, setEditingSite] = useState<SiteListItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  function handleCreate() {
    setMode('create')
    setEditingSite(null)
    setDialogOpen(true)
  }

  function handleEdit(site: SiteListItem) {
    setMode('edit')
    setEditingSite(site)
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      {sitesQuery.isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : (
        <SitesTable sites={sitesQuery.data ?? []} onEdit={handleEdit} onCreate={handleCreate} />
      )}

      <SiteFormDialog
        key={`${mode}-${editingSite?.id ?? 'new'}-${dialogOpen}`}
        mode={mode}
        site={editingSite}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
