import _ from 'lodash'

export type CustomSetOptions<T> = {
  compare: (a: T, b: T) => boolean
}

const DEFAULT_OPTIONS: CustomSetOptions<any> = {
  compare: _.isEqual
}

export class CustomSet<T> {
  private _options: CustomSetOptions<T>

  public constructor(
    private readonly _items: T[] = [],
    opt: Partial<CustomSetOptions<T>> = {}
  ) {
    this._options = { ...DEFAULT_OPTIONS, ...opt }
  }

  public get items(): T[] {
    return [...this._items]
  }

  public has(item: T): boolean {
    return this._items.some((i) => this._options.compare(i, item))
  }

  public isEqual(other: CustomSet<T>): boolean {
    return this.isSubsetOf(other) && other.isSubsetOf(this)
  }

  public isSubsetOf(other: CustomSet<T>): boolean {
    return this._items.every((i) => other.has(i))
  }
}
