export class SetBy<T> {
  private _items: Record<string, T> = {}

  public get length(): number {
    return Object.keys(this._items).length
  }

  public get values(): T[] {
    return Object.values(this._items)
  }

  constructor(initialItems: T[] = [], private _keyFn: (item: T) => string) {
    for (const item of initialItems) {
      this.add(item)
    }
  }

  public shift(): T | undefined {
    const [nextKey] = Object.keys(this._items)
    if (!nextKey) {
      return undefined
    }
    const next = this._items[nextKey]
    delete this._items[nextKey]
    return next
  }

  public add(workspace: T) {
    const key = this._keyFn(workspace)
    this._items[key] = workspace
  }

  public hasKey(name: string): boolean {
    return name in this._items
  }
}
