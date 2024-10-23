import * as types from './typings'
import * as structs from './structs'

export class TreeExplorer<Leaf extends types.TreeLeaf> {
  private _state: types.TreeExplorerState<Leaf>

  public constructor(tree: types.Tree<Leaf>, state?: types.TreeExplorerState<Leaf>) {
    this._state = state ?? {
      explored: [],
      toExplore: [tree]
    }
  }

  public get state(): types.TreeExplorerState<Leaf> {
    return this._state
  }

  public async getNext(): Promise<types.TreeNode<Leaf> | null> {
    const { next, ...state } = await this._exploreSingle(this._state)
    this._state = state
    return next
  }

  private async _exploreSingle(
    state: types.TreeExplorerState<Leaf>
  ): Promise<types.TreeExplorerState<Leaf> & { next: types.TreeNode<Leaf> | null }> {
    // breadth-first search algorithm (BFS)

    const explored = new structs.TreeSet(state.explored)
    const toExplore = new structs.TreeStack(state.toExplore)

    const current = toExplore.shift()
    if (current === undefined) {
      return { ...state, next: null }
    }

    if (this._isLeaf(current)) {
      explored.add(current)
      return { ...state, next: current }
    }

    const children = await current.getChildren()

    for (const child of children) {
      const currentHash = explored.get(child.id)?.hash
      if (currentHash === undefined) {
        toExplore.pushIfNotExist(child)
      } else if (currentHash !== child.hash) {
        explored.delete(child.id) // we invalidate this node so we can explore it again later
        toExplore.pushIfNotExist(child)
      }
    }

    explored.add(current)
    return { ...state, next: current }
  }

  private _isLeaf(node: types.TreeNode<Leaf>): node is Leaf {
    return !this._isTree(node)
  }

  private _isTree(node: types.TreeNode<Leaf>): node is types.Tree<Leaf> {
    if (typeof node !== 'object') {
      return false
    }
    if (node === null) {
      return false
    }
    if (!('children' in node)) {
      return false
    }
    if (!Array.isArray(node.children)) {
      return false
    }
    return true
  }
}
