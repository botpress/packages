import { TreeExplorer } from './explorer'
import * as types from './typings'
export * from './typings'

const PAGE_SIZE = 20

export type GetNextTreePageResponse<Leaf extends types.TreeLeaf> = {
  nodes: types.TreeNode<Leaf>[]
  state?: types.TreeExplorerState<Leaf>
}

export const getNextTreePage = async <Leaf extends types.TreeLeaf>(
  tree: types.Tree<Leaf>,
  state?: types.TreeExplorerState<Leaf>
): Promise<GetNextTreePageResponse<Leaf>> => {
  const explorer = new TreeExplorer(tree, state)

  let isDone = false
  const page: types.TreeNode<Leaf>[] = []
  for (let i = 0; i < PAGE_SIZE; i++) {
    const node = await explorer.getNext()
    if (node === null) {
      isDone = true
      break
    }
    page.push(node)
  }

  return {
    nodes: page,
    state: isDone ? undefined : explorer.state
  }
}
