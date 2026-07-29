import { useState } from 'react'
import { ArrowLeftIcon, ListChecksIcon } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { ButtonGroupInput } from '@/components/ButtonGroupInput'
import { EmptyState } from '@/components/EmptyState'
import { Pagination } from '@/components/Pagination'
import { TableSkeleton } from '@/components/skeletons/TableSkeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PileStatusBadge } from '../components/PileStatusBadge'
import { useSite, useSitePiles } from '../hooks/useSites'

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

  const siteQuery = useSite(siteId)
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          to="/piling/sites"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" />
          Back to Sites
        </Link>
        <h1 className="text-xl font-semibold text-foreground">{siteQuery.data?.name ?? 'Site piles'}</h1>
      </div>

      {pilesQuery.isLoading ? (
        <TableSkeleton rows={8} columns={3} />
      ) : (
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle>Piles</CardTitle>

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
            </div>
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
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {piles.map((pile) => (
                      <TableRow key={pile.id}>
                        <TableCell className="font-medium text-foreground">{pile.pileIdCode}</TableCell>
                        <TableCell className="text-muted-foreground">{pile.areaLocation ?? '—'}</TableCell>
                        <TableCell>
                          <PileStatusBadge status={pile.status} />
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
    </div>
  )
}
