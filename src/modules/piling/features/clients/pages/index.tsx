import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ClientFormDialog } from '../components/ClientFormDialog'
import { ClientsGrid } from '../components/ClientsGrid'
import { useClients } from '../hooks/useClients'
import type { ClientListItem } from '../types/clients.types'

function ClientsGridSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full max-w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function ClientsPage() {
  const clientsQuery = useClients()
  const [mode, setMode] = useState<'create' | 'edit'>('edit')
  const [editingClient, setEditingClient] = useState<ClientListItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  function handleCreate() {
    setMode('create')
    setEditingClient(null)
    setDialogOpen(true)
  }

  function handleEdit(client: ClientListItem) {
    setMode('edit')
    setEditingClient(client)
    setDialogOpen(true)
  }

  return (
    <div className="flex flex-col gap-6">
      {clientsQuery.isLoading ? (
        <ClientsGridSkeleton />
      ) : (
        <ClientsGrid clients={clientsQuery.data ?? []} onEdit={handleEdit} onCreate={handleCreate} />
      )}

      <ClientFormDialog
        key={`${mode}-${editingClient?.id ?? 'new'}-${dialogOpen}`}
        mode={mode}
        client={editingClient}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
