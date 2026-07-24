// Actual = categorical slot 1 (blue), Planned = slot 4 (amber) — reusing the
// app's own --chart-* tokens so light/dark swap for free instead of hardcoding hex.
// Shared across every "plan vs actual" chart in this module so they read as one system.
export const ACTUAL_COLOR = 'var(--color-chart-1)'
export const PLANNED_COLOR = 'var(--color-chart-4)'
