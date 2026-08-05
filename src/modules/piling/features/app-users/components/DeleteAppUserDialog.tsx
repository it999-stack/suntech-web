import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useDeleteAppUser } from '../hooks/useAppUsers'
import type { AppUser } from '../types/app-users.types'

interface DeleteAppUserDialogProps {
  siteId: string
  appUser: AppUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteAppUserDialog({ siteId, appUser, open, onOpenChange }: DeleteAppUserDialogProps) {
  const deleteAppUser = useDeleteAppUser()

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Remove app user?"
      description={
        <>
          This will remove <span className="font-medium text-foreground">{appUser?.name}</span>'s access to this
          site. Their account is not deleted and can be reassigned later.
        </>
      }
      onConfirm={async () => {
        if (!appUser) return
        await deleteAppUser.mutateAsync({ siteId, userId: appUser.id })
      }}
      successMessage="App user removed from site"
      errorMessage="Failed to remove app user"
      confirmLabel="Remove"
    />
  )
}
