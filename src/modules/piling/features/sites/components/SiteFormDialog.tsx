import { useMemo, useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getErrorMessage } from '@/lib/errors'
import { useClients } from '@/modules/piling/features/clients/hooks/useClients'
import { useCompanies, useCreateSite, useUpdateSite } from '../hooks/useSites'
import type { SiteListItem } from '../types/sites.types'

interface SiteFormDialogProps {
  mode: 'create' | 'edit'
  site?: SiteListItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SiteFormDialog({
  mode,
  site,
  open,
  onOpenChange,
}: SiteFormDialogProps) {
  const [siteName, setSiteName] = useState(() => (mode === 'edit' && site ? site.name : ''))
  const [location, setLocation] = useState(() => (mode === 'edit' && site ? site.location ?? '' : ''))
  const [clientId, setClientId] = useState(() => (mode === 'edit' && site ? site.clientId : ''))
  const [companyId, setCompanyId] = useState('')

  const clientsQuery = useClients()
  const companiesQuery = useCompanies()
  const createSite = useCreateSite()
  const updateSite = useUpdateSite()

  const companySelectItems = useMemo(
    () => (companiesQuery.data ?? []).map((company) => ({ value: company.id, label: company.name })),
    [companiesQuery.data]
  )
  const clientSelectItems = useMemo(
    () => (clientsQuery.data ?? []).map((client) => ({ value: client.id, label: client.name })),
    [clientsQuery.data]
  )

  async function handleSubmit() {
    try {
      if (mode === 'edit') {
        if (!site) return

        await updateSite.mutateAsync({
          siteId: site.id,
          payload: {
            clientId,
            name: siteName.trim(),
            location: location.trim() || null,
          },
        })

        toast.success('Site updated')
      } else {
        await createSite.mutateAsync({
          clientId,
          payload: {
            companyId,
            name: siteName.trim(),
            location: location.trim() || null,
            targetEndDate: null,
          },
        })
        toast.success('Site created')
      }

      onOpenChange(false)
    } catch (error) {
      toast.error(
        getErrorMessage(
          error,
          mode === 'create'
            ? 'Failed to create site'
            : 'Failed to update site'
        )
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[420px] gap-4">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Create Site' : 'Edit Site'}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            {mode === 'create' && (
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="site-company">Company</Label>

                <Select
                  items={companySelectItems}
                  value={companyId}
                  onValueChange={(value) => setCompanyId(value ?? '')}
                >
                  <SelectTrigger id="site-company" className="w-full">
                    <SelectValue
                      placeholder={
                        companiesQuery.isLoading
                          ? 'Loading companies...'
                          : 'Select a company'
                      }
                    />
                  </SelectTrigger>

                  <SelectContent className="min-w-72">
                    <SelectGroup>
                      <SelectLabel>Companies</SelectLabel>

                      {(companiesQuery.data ?? []).map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          <span className="block truncate">{company.name}</span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            )}
          
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="site-client">Client</Label>

              <Select
                items={clientSelectItems}
                value={clientId}
                onValueChange={(value) => setClientId(value ?? '')}
              >
                <SelectTrigger id="site-client" className="w-full">
                  <SelectValue
                    placeholder={
                      clientsQuery.isLoading
                        ? 'Loading clients...'
                        : 'Select a client'
                    }
                  />
                </SelectTrigger>

                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Clients</SelectLabel>

                    {(clientsQuery.data ?? []).map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="site-name">Site Name</Label>
          <Input
            id="site-name"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="site-location">Location</Label>
          <Input
            id="site-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        {/* TODO: Target End Date */}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>
            Cancel
          </DialogClose>

          <Button
            onClick={handleSubmit}
            loading={createSite.isPending || updateSite.isPending}
            disabled={
              !siteName.trim() ||
              !clientId ||
              clientsQuery.isLoading ||
              (mode === 'create' && (!companyId || companiesQuery.isLoading))
            }
          >
            {mode === 'create' ? 'Create' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
