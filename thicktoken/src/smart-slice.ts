export type Slice = [number, number]

export class SmartSlice {
  private _sortedSlices: Slice[]

  public constructor(slices: Slice[], max: number) {
    // merge and sort slices here if needed

    const trimmed: Slice[] = []
    for (const [start, end] of slices) {
      const clampedStart = Math.max(0, Math.min(max, start))
      const clampedEnd = Math.max(0, Math.min(max, end))
      if (clampedStart < clampedEnd) {
        trimmed.push([clampedStart, clampedEnd])
      }
    }

    const sorted: Slice[] = trimmed.sort((a, b) => a[0] - b[0])

    const merged: Slice[] = []
    for (const [start, end] of sorted) {
      const last = merged[merged.length - 1]
      if (last && start <= last[1]) {
        // overlapping or contiguous slices, merge them
        last[1] = Math.max(last[1], end)
      } else {
        // no overlap, add new slice
        merged.push([start, end])
      }
    }

    this._sortedSlices = merged
  }

  public *[Symbol.iterator](): Generator<number> {
    for (const [start, end] of this._sortedSlices) {
      for (let i = start; i < end; i++) {
        yield i
      }
    }
  }
}
