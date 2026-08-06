import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getErrorMessage } from '@/lib/errors'
import { useUpdateUserPassword } from '../hooks/useUsers'
import type { UserListItem } from '../types/users.types'

interface UpdateUserPasswordDialogProps {
  user: UserListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UpdateUserPasswordDialog({ user, open, onOpenChange }: UpdateUserPasswordDialogProps) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const updatePassword = useUpdateUserPassword()

  const passwordsMatch = password.length >= 6 && password === confirmPassword

  async function handleSubmit() {
    if (!user || !passwordsMatch) return

    try {
      await updatePassword.mutateAsync({ userId: user.id, payload: { password } })
      toast.success('Password updated')
      setPassword('')
      setConfirmPassword('')
      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update password'))
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setPassword('')
          setConfirmPassword('')
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="w-[420px] gap-4">
        <DialogHeader>
          <DialogTitle>Update Password{user ? ` — ${user.name}` : ''}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-new-password">New password</Label>
          <Input
            id="user-new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-confirm-password">Confirm password</Label>
          <Input
            id="user-confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button onClick={handleSubmit} loading={updatePassword.isPending} disabled={!passwordsMatch}>
            Update Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
