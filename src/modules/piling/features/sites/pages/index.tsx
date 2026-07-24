import { useState } from 'react'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { EditSiteDialog } from '../components/EditSiteDialog'
import { SitesTable } from '../components/SitesTable'
import { useSites } from '../hooks/useSites'
import type { SiteListItem } from '../types/sites.types'

export default function SitesPage() {
  const sitesQuery = useSites()
  const [editingSite, setEditingSite] = useState<SiteListItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  function handleEdit(site: SiteListItem) {
    setEditingSite(site)
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      {sitesQuery.isLoading ? (
        <TableSkeleton rows={5} columns={6} />
      ) : (
        <SitesTable sites={sitesQuery.data ?? []} onEdit={handleEdit} />
      )}

      <EditSiteDialog site={editingSite} open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  )
}
