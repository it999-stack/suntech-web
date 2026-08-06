import { PencilLine, PlusIcon, UsersIcon } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useHasCapability } from '@/modules/auth/hooks/useHasCapability'
import type { ClientListItem } from '../types/clients.types'

interface ClientsGridProps {
  clients: ClientListItem[]
  onEdit: (client: ClientListItem) => void
  onCreate: () => void
}

export function ClientsGrid({ clients, onEdit, onCreate }: ClientsGridProps) {
  const canManage = useHasCapability('clients:manage')

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Clients</h2>

        {canManage && (
          <Button onClick={onCreate}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Create Client
          </Button>
        )}
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={UsersIcon}
              title="No clients yet"
              description="Clients tied to your sites will show up here once they're added."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardHeader>
                <CardTitle>{client.name}</CardTitle>

                {canManage && (
                  <CardAction>
                    <Button variant="ghost" size="icon-sm" onClick={() => onEdit(client)}>
                      <PencilLine />
                      <span className="sr-only">Edit {client.name}</span>
                    </Button>
                  </CardAction>
                )}
              </CardHeader>

              <CardContent>
                {client.sites.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No sites yet</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {client.sites.map((site) => (
                      <Badge key={site.id} variant="secondary">
                        {site.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
