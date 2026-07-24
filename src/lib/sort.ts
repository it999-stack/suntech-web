/** Ascending numeric comparator over one or more key selectors, applied in
 * order until a non-zero difference is found — e.g.
 * `rows.sort(byNumber((r) => r.sequenceOrder, (r) => r.pileSeqNo))`. */
export function byNumber<T>(...selectors: Array<(item: T) => number>): (a: T, b: T) => number {
  return (a, b) => {
    for (const selector of selectors) {
      const diff = selector(a) - selector(b)
      if (diff !== 0) return diff
    }
    return 0
  }
}
