import { useRef, useState } from 'react'
import { AlertCircleIcon, CheckCircle2Icon, DownloadIcon, FileSpreadsheetIcon, UploadIcon, XIcon } from 'lucide-react'
import { toast } from 'sonner'
import { PageSizeSelect } from '@/components/PageSizeSelect'
import { Pagination } from '@/components/Pagination'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '@/components/ui/attachment'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { getErrorMessage } from '@/lib/errors'
import { personnelService } from '../api/personnel.api'
import { useConfirmPersonnelImport, usePreviewPersonnelImport } from '../hooks/usePersonnel'
import { personnelDesignationLabel } from '../types/personnel.types'
import type { PersonnelImportPreview } from '../types/personnel.types'

interface PersonnelImportDialogProps {
  siteId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function PersonnelImportDialog({ siteId, open, onOpenChange }: PersonnelImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PersonnelImportPreview | null>(null)
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const previewImport = usePreviewPersonnelImport()
  const confirmImport = useConfirmPersonnelImport()

  function reset() {
    setSelectedFile(null)
    setPreview(null)
    setPage(1)
    setPageSize(20)
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) reset()
    onOpenChange(nextOpen)
  }

  async function handleDownloadTemplate() {
    setIsDownloadingTemplate(true)
    try {
      await personnelService.downloadPersonnelImportTemplate(siteId)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to download template'))
    } finally {
      setIsDownloadingTemplate(false)
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null
    e.target.value = ''
    if (selected) setSelectedFile(selected)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const dropped = e.dataTransfer.files?.[0]
    if (dropped) setSelectedFile(dropped)
  }

  async function handlePreview() {
    if (!selectedFile) return
    try {
      const result = await previewImport.mutateAsync({ siteId, file: selectedFile })
      setPreview(result)
      setPage(1)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to read the uploaded file'))
    }
  }

  async function handleConfirm() {
    if (!preview) return
    const validRows = preview.rows.filter((row) => row.status === 'ok')
    if (validRows.length === 0) return

    try {
      const result = await confirmImport.mutateAsync({ siteId, rows: validRows })
      toast.success(`${result.created} personnel imported`)
      if (result.failedRows.length > 0) {
        toast.error(`${result.failedRows.length} row(s) could not be imported — data may have changed`)
      }
      handleOpenChange(false)
    } catch (error) {
      toast.error(getErrorMessage(error, 'Failed to import personnel'))
    }
  }

  const validRows = preview?.rows.filter((row) => row.status === 'ok') ?? []
  const totalRows = preview?.rows.length ?? 0
  const totalPages = Math.max(Math.ceil(totalRows / pageSize), 1)
  const pagedRows = preview?.rows.slice((page - 1) * pageSize, page * pageSize) ?? []

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex max-h-[85vh] w-full flex-col gap-4 sm:max-w-[960px]">
        <DialogHeader>
          <DialogTitle>Import Personnel</DialogTitle>
        </DialogHeader>

        {!preview ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Upload an Excel sheet with one row per person. Employee Code is required (it's how the import
              tells people apart) and Designation must be one of the site's fixed roles — download the
              template below to see the exact columns and valid designations.
            </p>

            <Button variant="outline" onClick={handleDownloadTemplate} loading={isDownloadingTemplate} className="w-fit">
              <DownloadIcon className="mr-2 h-4 w-4" />
              Download template
            </Button>

            <div className="flex flex-col gap-2" onDragOver={(e) => e.preventDefault()} onDrop={handleDrop}>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileInputChange}
              />

              {!selectedFile ? (
                <Attachment state="idle" className="w-full">
                  <AttachmentTrigger onClick={() => fileInputRef.current?.click()} />
                  <AttachmentMedia>
                    <UploadIcon />
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>Click to upload or drag and drop</AttachmentTitle>
                    <AttachmentDescription>XLSX or XLS files</AttachmentDescription>
                  </AttachmentContent>
                </Attachment>
              ) : (
                <>
                  <Attachment state="done" className="w-full">
                    <AttachmentTrigger onClick={() => fileInputRef.current?.click()} />
                    <AttachmentMedia className="bg-emerald-100 text-emerald-600">
                      <FileSpreadsheetIcon />
                    </AttachmentMedia>
                    <AttachmentContent>
                      <AttachmentTitle>{selectedFile.name}</AttachmentTitle>
                      <AttachmentDescription>
                        {formatFileSize(selectedFile.size)} · ready to preview
                      </AttachmentDescription>
                    </AttachmentContent>
                    <AttachmentActions>
                      <AttachmentAction aria-label="Remove file" onClick={() => setSelectedFile(null)}>
                        <XIcon />
                      </AttachmentAction>
                    </AttachmentActions>
                  </Attachment>
                  <p className="text-xs text-muted-foreground">
                    Drop a new file here or click below to replace it.
                  </p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant={preview.invalid === 0 ? 'default' : 'secondary'}>
                {preview.valid} of {preview.total} rows valid
              </Badge>
              {preview.invalid > 0 && (
                <span className="text-muted-foreground">{preview.invalid} row(s) have errors and will be skipped</span>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Row</TableHead>
                    <TableHead>Employee Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedRows.map((row) => (
                    <TableRow key={row.rowNumber}>
                      <TableCell className="text-muted-foreground">{row.rowNumber}</TableCell>
                      <TableCell className="font-medium text-foreground">{row.employeeCode ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{row.name ?? '—'}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.designation ? personnelDesignationLabel(row.designation) : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{row.phone ?? '—'}</TableCell>
                      <TableCell className="whitespace-normal">
                        {row.status === 'ok' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600">
                            <CheckCircle2Icon className="size-3.5" />
                            OK
                          </span>
                        ) : (
                          <span className="inline-flex items-start gap-1 text-destructive">
                            <AlertCircleIcon className="mt-0.5 size-3.5 shrink-0" />
                            {row.errors.join('; ')}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              totalItems={totalRows}
              pageSize={pageSize}
              onPageChange={setPage}
              pageSizeSelector={
                <PageSizeSelect
                  value={pageSize}
                  onValueChange={(next) => {
                    setPageSize(next)
                    setPage(1)
                  }}
                />
              }
            />
          </div>
        )}

        <DialogFooter>
          {preview && (
            <Button variant="outline" onClick={reset}>
              Back
            </Button>
          )}
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>

          {!preview ? (
            <Button onClick={handlePreview} loading={previewImport.isPending} disabled={!selectedFile}>
              <UploadIcon className="mr-2 h-4 w-4" />
              Preview import
            </Button>
          ) : (
            <Button onClick={handleConfirm} loading={confirmImport.isPending} disabled={validRows.length === 0}>
              Import {validRows.length} personnel
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
