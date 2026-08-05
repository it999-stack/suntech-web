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
import { useCreateAppUser, useUpdateAppUser } from '../hooks/useAppUsers'
import type { AppUser } from '../types/app-users.types'

interface AppUserFormDialogProps {
  mode: 'create' | 'edit'
  siteId: string
  appUser?: AppUser | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AppUserFormDialog({ mode, siteId, appUser, open, onOpenChange }: AppUserFormDialogProps) {
  const [name, setName] = useState(() => (mode === 'edit' && appUser ? appUser.name : ''))
  const [email, setEmail] = useState(() => (mode === 'edit' && appUser ? appUser.email : ''))
  const [password, setPassword] = useState('')

  const createAppUser = useCreateAppUser()
  const updateAppUser = useUpdateAppUser()

  async function handleSubmit() {
    try {
      if (mode === 'edit') {
        if (!appUser) return

        await updateAppUser.mutateAsync({
          siteId,
          userId: appUser.id,
          payload: { name: name.trim(), email: email.trim() },
        })

        toast.success('App user updated')
      } else {
        await createAppUser.mutateAsync({
          siteId,
          payload: { name: name.trim(), email: email.trim(), password },
        })

        toast.success('App user created')
      }

      onOpenChange(false)
    } catch (error) {
      toast.error(
        getErrorMessage(error, mode === 'create' ? 'Failed to create app user' : 'Failed to update app user')
      )
    }
  }

  const isValid = name.trim() && email.trim() && (mode === 'edit' || password.length >= 6)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] gap-4">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create App User' : 'Edit App User'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="app-user-name">Name</Label>
          <Input id="app-user-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="app-user-email">Email</Label>
          <Input
            id="app-user-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {mode === 'create' && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="app-user-password">Password</Label>
            <Input
              id="app-user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button
            onClick={handleSubmit}
            loading={createAppUser.isPending || updateAppUser.isPending}
            disabled={!isValid}
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
