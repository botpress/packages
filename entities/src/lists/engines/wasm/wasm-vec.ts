type Arr<S> = { push: (item: S) => void }
type Ctor<X extends any[], Y> = new (...args: X) => Y
type ElementOf<A extends Arr<any>> = A extends Arr<infer S> ? S : never

export class WasmVec<A extends Arr<any>> {
  public readonly x: A

  constructor(ctor: Ctor<[], A>) {
    this.x = new ctor()
  }

  public readonly fill = (items: ElementOf<A>[]): this => {
    items.forEach((item) => this.x.push(item))
    return this
  }
}
