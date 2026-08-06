import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from '@/components/ui/combobox'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getErrorMessage } from '@/lib/errors'
import { useSites } from '@/modules/piling/features/sites/hooks/useSites'
import { useCreateUser, useUpdateUser } from '../hooks/useUsers'
import { isSiteScopedRole, ROLE_OPTIONS } from '../types/users.types'
import type { UserListItem, UserRole } from '../types/users.types'

interface UserFormDialogProps {
  mode: 'create' | 'edit'
  user?: UserListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UserFormDialog({ mode, user, open, onOpenChange }: UserFormDialogProps) {
  const [name, setName] = useState(() => (mode === 'edit' && user ? user.name : ''))
  const [email, setEmail] = useState(() => (mode === 'edit' && user ? user.email : ''))
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>(() => (mode === 'edit' && user ? user.role : ROLE_OPTIONS[0].value))
  const [siteIds, setSiteIds] = useState<string[]>(() => (mode === 'edit' && user ? user.sites.map((s) => s.id) : []))

  const sitesQuery = useSites()
  const siteOptions = sitesQuery.data ?? []
  const comboboxAnchor = useComboboxAnchor()

  const createUser = useCreateUser()
  const updateUser = useUpdateUser()

  const siteScoped = isSiteScopedRole(role)

  function handleRoleChange(nextRole: UserRole) {
    setRole(nextRole)
    if (!isSiteScopedRole(nextRole)) {
      setSiteIds([])
    }
  }

  async function handleSubmit() {
    try {
      if (mode === 'edit') {
        if (!user) return

        await updateUser.mutateAsync({
          userId: user.id,
          payload: { name: name.trim(), email: email.trim(), role, siteIds: siteScoped ? siteIds : [] },
        })

        toast.success('User updated')
      } else {
        await createUser.mutateAsync({
          name: name.trim(),
          email: email.trim(),
          password,
          role,
          siteIds: siteScoped ? siteIds : [],
        })

        toast.success('User created')
      }

      onOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, mode === 'create' ? 'Failed to create user' : 'Failed to update user'))
    }
  }

  const isValid = name.trim() && email.trim() && (mode === 'edit' || password.length >= 6)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] gap-4">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Create User' : 'Edit User'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-name">Name</Label>
          <Input id="user-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-email">Email</Label>
          <Input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        {mode === 'create' && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="user-password">Password</Label>
            <Input
              id="user-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="user-role">Role</Label>
          <Select value={role} onValueChange={(value) => handleRoleChange(value as UserRole)}>
            <SelectTrigger id="user-role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {siteScoped && (
          <div className="flex flex-col gap-1.5">
            <Label>Assigned sites</Label>
            <Combobox
              items={siteOptions.map((site) => ({ value: site.id, label: site.name }))}
              multiple
              value={siteIds}
              onValueChange={(value) => setSiteIds(value)}
            >
              <ComboboxChips ref={comboboxAnchor}>
                {siteIds.map((siteId) => {
                  const site = siteOptions.find((s) => s.id === siteId)
                  return (
                    <ComboboxChip key={siteId}>
                      {site?.name ?? siteId}
                    </ComboboxChip>
                  )
                })}
                <ComboboxChipsInput placeholder="Add site..." />
              </ComboboxChips>

              <ComboboxContent anchor={comboboxAnchor}>
                <ComboboxEmpty>No sites found.</ComboboxEmpty>
                <ComboboxList>
                  {(item: { value: string; label: string }) => (
                    <ComboboxItem key={item.value} value={item.value}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          <Button
            onClick={handleSubmit}
            loading={createUser.isPending || updateUser.isPending}
            disabled={!isValid}
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
