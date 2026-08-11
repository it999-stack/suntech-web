import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useDeleteLocation } from '../hooks/useLocations'
import type { SiteLocation } from '../types/locations.types'

interface DeleteLocationDialogProps {
  siteId: string
  location: SiteLocation | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteLocationDialog({ siteId, location, open, onOpenChange }: DeleteLocationDialogProps) {
  const deleteLocation = useDeleteLocation()

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete location?"
      description={
        <>
          This will delete location <span className="font-medium text-foreground">{location?.name}</span>. Piles
          currently assigned to it will become unassigned. This action cannot be undone.
        </>
      }
      onConfirm={async () => {
        if (!location) return
        await deleteLocation.mutateAsync({ siteId, locationId: location.id })
      }}
      successMessage="Location deleted"
      errorMessage="Failed to delete location"
    />
  )
}
