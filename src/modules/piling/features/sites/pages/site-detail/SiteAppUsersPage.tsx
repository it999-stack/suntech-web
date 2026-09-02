import { useState } from 'react'
import { KeyRound, PencilLine, PlusIcon, Trash2Icon, UsersIcon } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { EmptyState } from '@/components/EmptyState'
import { PageLoader } from '@/components/PageLoader'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getErrorMessage } from '@/lib/errors'
import { AppUserFormDialog } from '../../../app-users/components/AppUserFormDialog'
import { DeleteAppUserDialog } from '../../../app-users/components/DeleteAppUserDialog'
import { UpdateAppUserPasswordDialog } from '../../../app-users/components/UpdateAppUserPasswordDialog'
import { useSiteAppUsers, useToggleAppUserActive } from '../../../app-users/hooks/useAppUsers'
import type { AppUser } from '../../../app-users/types/app-users.types'

export default function SiteAppUsersPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [appUserToEdit, setAppUserToEdit] = useState<AppUser | null>(null)
  const [appUserToDelete, setAppUserToDelete] = useState<AppUser | null>(null)
  const [appUserForPassword, setAppUserForPassword] = useState<AppUser | null>(null)

  const appUsersQuery = useSiteAppUsers(siteId)
  const appUsers = appUsersQuery.data ?? []

  const toggleActive = useToggleAppUserActive()

  async function handleToggleActive(appUser: AppUser, isActive: boolean) {
    if (!siteId) return
    try {
      await toggleActive.mutateAsync({ siteId, userId: appUser.id, isActive })
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to update status'))
    }
  }

  return (
    <>
      {appUsersQuery.isLoading ? (
        <PageLoader />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>App Users</CardTitle>

            <CardAction>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create App User
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent>
            {appUsers.length === 0 ? (
              <EmptyState
                icon={UsersIcon}
                title="No app users yet"
                description="App users assigned to this site will show up here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appUsers.map((appUser) => (
                    <TableRow key={appUser.id}>
                      <TableCell className="font-medium text-foreground">{appUser.name}</TableCell>
                      <TableCell className="text-muted-foreground">{appUser.email}</TableCell>
                      <TableCell>
                        <Switch
                          checked={appUser.isActive}
                          onCheckedChange={(checked) => handleToggleActive(appUser, checked)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => setAppUserToEdit(appUser)}>
                          <PencilLine />
                          <span className="sr-only">Edit {appUser.name}</span>
                        </Button>

                        <Button variant="ghost" size="icon-sm" onClick={() => setAppUserForPassword(appUser)}>
                          <KeyRound />
                          <span className="sr-only">Update password for {appUser.name}</span>
                        </Button>

                        <Button variant="ghost" size="icon-sm" onClick={() => setAppUserToDelete(appUser)}>
                          <Trash2Icon className="text-destructive" />
                          <span className="sr-only">Remove {appUser.name}</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {siteId && (
        <AppUserFormDialog
          key={String(createDialogOpen)}
          mode="create"
          siteId={siteId}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}

      {siteId && (
        <AppUserFormDialog
          key={appUserToEdit?.id}
          mode="edit"
          siteId={siteId}
          appUser={appUserToEdit}
          open={appUserToEdit !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setAppUserToEdit(null)
          }}
        />
      )}

      {siteId && (
        <DeleteAppUserDialog
          siteId={siteId}
          appUser={appUserToDelete}
          open={appUserToDelete !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setAppUserToDelete(null)
          }}
        />
      )}

      <UpdateAppUserPasswordDialog
        appUser={appUserForPassword}
        open={appUserForPassword !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setAppUserForPassword(null)
        }}
      />
    </>
  )
}
