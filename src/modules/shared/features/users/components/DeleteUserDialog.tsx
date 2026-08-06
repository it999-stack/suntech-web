import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog'
import { useDeleteUser } from '../hooks/useUsers'
import type { UserListItem } from '../types/users.types'

interface DeleteUserDialogProps {
  user: UserListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteUserDialog({ user, open, onOpenChange }: DeleteUserDialogProps) {
  const deleteUser = useDeleteUser()

  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete user?"
      description={
        <>
          This will permanently delete <span className="font-medium text-foreground">{user?.name}</span>'s account
          and remove access to all assigned sites. This cannot be undone.
        </>
      }
      onConfirm={async () => {
        if (!user) return
        await deleteUser.mutateAsync(user.id)
      }}
      successMessage="User deleted"
      errorMessage="Failed to delete user"
      confirmLabel="Delete"
    />
  )
}
