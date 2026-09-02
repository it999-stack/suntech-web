import { useState } from 'react'
import { KeyRound, PencilLine, PlusIcon, Trash2Icon, UsersIcon } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { PageLoader } from '@/components/PageLoader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DeleteUserDialog } from '../components/DeleteUserDialog'
import { UpdateUserPasswordDialog } from '../components/UpdateUserPasswordDialog'
import { UserFormDialog } from '../components/UserFormDialog'
import { useUsers } from '../hooks/useUsers'
import { isSiteScopedRole, ROLE_OPTIONS } from '../types/users.types'
import type { UserListItem } from '../types/users.types'

function roleLabel(role: UserListItem['role']): string {
  return ROLE_OPTIONS.find((option) => option.value === role)?.label ?? role
}

function sitesLabel(user: UserListItem): string {
  if (user.sites.length > 0) return user.sites.map((site) => site.name).join(', ')
  return isSiteScopedRole(user.role) ? 'No sites assigned' : 'All sites'
}

export default function UsersPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [userToEdit, setUserToEdit] = useState<UserListItem | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserListItem | null>(null)
  const [userForPassword, setUserForPassword] = useState<UserListItem | null>(null)

  const usersQuery = useUsers()
  const users = usersQuery.data ?? []

  return (
    <>
      {usersQuery.isLoading ? (
        <PageLoader />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>

            <CardAction>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create User
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent>
            {users.length === 0 ? (
              <EmptyState icon={UsersIcon} title="No users yet" description="Users you create will show up here." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Sites</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-foreground">{user.name}</TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{roleLabel(user.role)}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{sitesLabel(user)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon-sm" onClick={() => setUserToEdit(user)}>
                          <PencilLine />
                          <span className="sr-only">Edit {user.name}</span>
                        </Button>

                        <Button variant="ghost" size="icon-sm" onClick={() => setUserForPassword(user)}>
                          <KeyRound />
                          <span className="sr-only">Update password for {user.name}</span>
                        </Button>

                        <Button variant="ghost" size="icon-sm" onClick={() => setUserToDelete(user)}>
                          <Trash2Icon className="text-destructive" />
                          <span className="sr-only">Delete {user.name}</span>
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

      <UserFormDialog
        key={String(createDialogOpen)}
        mode="create"
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <UserFormDialog
        key={userToEdit?.id}
        mode="edit"
        user={userToEdit}
        open={userToEdit !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setUserToEdit(null)
        }}
      />

      <DeleteUserDialog
        user={userToDelete}
        open={userToDelete !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setUserToDelete(null)
        }}
      />

      <UpdateUserPasswordDialog
        user={userForPassword}
        open={userForPassword !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setUserForPassword(null)
        }}
      />
    </>
  )
}
