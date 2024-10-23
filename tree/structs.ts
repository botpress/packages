import * as types from './typings'

export class TreeStack<Leaf extends types.TreeLeaf> {
  private _trees: types.TreeNode<Leaf>[]

  public constructor(nodes: types.TreeNode<Leaf>[] = []) {
    this._trees = nodes
  }

  public pushIfNotExist(node: types.TreeNode<Leaf>): void {
    if (!this._trees.some((n) => n.id === node.id)) {
      this._trees.push(node)
    }
  }

  public pop(): types.TreeNode<Leaf> | undefined {
    return this._trees.pop()
  }

  public shift(): types.TreeNode<Leaf> | undefined {
    return this._trees.shift()
  }

  public length(): number {
    return this._trees.length
  }
}

export class TreeSet<Leaf extends types.TreeLeaf> {
  private _trees: Record<string, types.TreeNode<Leaf>>

  public constructor(nodes: types.TreeNode<Leaf>[] = []) {
    this._trees = {}
    for (const node of nodes) {
      this.add(node)
    }
  }

  public add(node: types.TreeNode<Leaf>): void {
    this._trees[node.id] = node
  }

  public has(id: string): boolean {
    return this._trees[id] !== undefined
  }

  public get(id: string): types.TreeNode<Leaf> | undefined {
    return this._trees[id]
  }

  public delete(id: string): void {
    delete this._trees[id]
  }

  public length(): number {
    return Object.keys(this._trees).length
  }
}
