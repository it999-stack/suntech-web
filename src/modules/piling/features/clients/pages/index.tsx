import { useState } from 'react'
import { PageLoader } from '@/components/PageLoader'
import { ClientFormDialog } from '../components/ClientFormDialog'
import { ClientsGrid } from '../components/ClientsGrid'
import { useClients } from '../hooks/useClients'
import type { ClientListItem } from '../types/clients.types'

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
    <div className="flex flex-1 flex-col gap-6">
      {clientsQuery.isLoading ? (
        <PageLoader />
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
