import { useState } from 'react'
import { ListChecksIcon, PencilLine, PlusIcon, Trash2Icon } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { ButtonGroupInput } from '@/components/ButtonGroupInput'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DeletePileDialog } from '../../../piles/components/DeletePileDialog'
import { PileFormDialog } from '../../../piles/components/PileFormDialog'
import { PileStatusBadge } from '../../components/PileStatusBadge'
import { useSitePiles } from '../../hooks/useSites'
import type { SitePileListItem } from '../../types/sites.types'

const pageSizeItems = [
  { value: '20', label: '20 / page' },
  { value: '30', label: '30 / page' },
  { value: '50', label: '50 / page' },
]

export default function SitePilesPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [pileIdToEdit, setPileIdToEdit] = useState<string | null>(null)
  const [pileToDelete, setPileToDelete] = useState<SitePileListItem | null>(null)

  const pilesQuery = useSitePiles(siteId, { page, limit, search })

  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function handleLimitChange(value: string | null) {
    setLimit(Number(value ?? 20))
    setPage(1)
  }

  const piles = pilesQuery.data?.items ?? []
  const total = pilesQuery.data?.total ?? 0
  const totalPages = Math.max(Math.ceil(total / limit), 1)

  return (
    <>
      {pilesQuery.isLoading ? (
        <TableSkeleton rows={8} columns={5} />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Piles</CardTitle>

            <CardAction>
              <div className="flex flex-wrap items-center gap-2">
              <ButtonGroupInput
                value={search}
                onValueChange={handleSearchChange}
                placeholder="Search pile..."
                className="w-64"
              />

              <Select value={String(limit)} onValueChange={handleLimitChange} items={pageSizeItems}>
                <SelectTrigger size="sm" className="w-32">
                  <SelectValue placeholder="20 / page" />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    {pageSizeItems.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>

              <Button onClick={() => setCreateDialogOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Create Pile
              </Button>
            </div>
            </CardAction>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            {piles.length === 0 ? (
              <EmptyState
                icon={ListChecksIcon}
                title={search ? 'No matching piles' : 'No piles yet'}
                description={
                  search
                    ? 'Try a different search term.'
                    : 'Piles added to this site will show up here.'
                }
              />
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pile Id</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {piles.map((pile) => (
                      <TableRow key={pile.id}>
                        <TableCell className="font-medium text-foreground">{pile.pileIdCode}</TableCell>
                        <TableCell className="text-muted-foreground">{pile.areaName ?? '—'}</TableCell>
                        <TableCell className="text-muted-foreground">{pile.areaLocation ?? '—'}</TableCell>
                        <TableCell>
                          <PileStatusBadge status={pile.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon-sm" onClick={() => setPileIdToEdit(pile.id)}>
                            <PencilLine className="size-4" />
                            <span className="sr-only">Edit {pile.pileIdCode}</span>
                          </Button>

                          <Button variant="ghost" size="icon-sm" onClick={() => setPileToDelete(pile)}>
                            <Trash2Icon className="text-destructive" />
                            <span className="sr-only">Delete {pile.pileIdCode}</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Pagination
                  page={page}
                  totalPages={totalPages}
                  totalItems={total}
                  pageSize={limit}
                  onPageChange={setPage}
                />
              </>
            )}
          </CardContent>
        </Card>
      )}

      {siteId && (
        <PileFormDialog
          key={String(createDialogOpen)}
          mode="create"
          siteId={siteId}
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />
      )}

      {siteId && (
        <PileFormDialog
          key={pileIdToEdit}
          mode="edit"
          siteId={siteId}
          pileId={pileIdToEdit ?? undefined}
          open={pileIdToEdit !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setPileIdToEdit(null)
          }}
        />
      )}

      {siteId && (
        <DeletePileDialog
          siteId={siteId}
          pile={pileToDelete}
          open={pileToDelete !== null}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) setPileToDelete(null)
          }}
        />
      )}
    </>
  )
}
