/** Marker for `Record<Enum, Shape>` status/visual maps across the app (e.g.
 * stepStatusVisuals, siteStatusVisuals) — documents that every such map
 * carries at least a human-readable label. Each feature keeps its own
 * concrete map co-located with its enum; this only standardizes the shape,
 * it never centralizes the maps themselves (they're domain-specific and
 * differ in what else they carry, e.g. icons, class names). */
export interface StatusVisualBase {
  label: string
}
