export type Slice = [number, number]

export class SmartSlice {
  private _sortedSlices: Slice[]

  public constructor(slices: Slice[], max: number) {
    const clampedSlices: Slice[] = slices.map((s) => this._clampSlice(s, max))
    const nonEmptySlices: Slice[] = clampedSlices.filter(([start, end]) => start < end)
    const sortedSlices: Slice[] = nonEmptySlices.sort((a, b) => a[0] - b[0])

    const merged: Slice[] = []
    for (const [start, end] of sortedSlices) {
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

  private _clampSlice = (slice: Slice, max: number): Slice => {
    let [start, end] = slice

    // flip slice
    start = start < 0 ? max + start : start
    end = end < 0 ? max + end : end

    // clamp slice
    const clampedStart = Math.max(0, Math.min(start, max))
    const clampedEnd = Math.max(0, Math.min(end, max))

    return [clampedStart, clampedEnd]
  }

  public *[Symbol.iterator](): Generator<number> {
    for (const [start, end] of this._sortedSlices) {
      for (let i = start; i < end; i++) {
        yield i
      }
    }
  }
}
