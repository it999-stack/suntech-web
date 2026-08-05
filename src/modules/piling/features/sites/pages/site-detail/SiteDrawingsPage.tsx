import { FileImageIcon } from 'lucide-react'
import { EmptyState } from '@/components/EmptyState'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SiteDrawingsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Drawings</CardTitle>
      </CardHeader>

      <CardContent>
        <EmptyState
          icon={FileImageIcon}
          title="Coming soon"
          description="Drawings for this site will show up here."
        />
      </CardContent>
    </Card>
  )
}
