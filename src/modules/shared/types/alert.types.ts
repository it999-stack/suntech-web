export type AlertSeverity = 'info' | 'warning' | 'critical'

export interface AlertItem {
  id: string
  title: string
  description: string
  severity: AlertSeverity
  category?: string
  timestamp?: string
}
