export type TreeLeaf = {
  id: string
  hash: string
}

export type TreeNode<Leaf extends TreeLeaf> = Tree<Leaf> | Leaf

export type Tree<Leaf extends TreeLeaf> = TreeLeaf & {
  getChildren: () => Promise<TreeNode<Leaf>[]>
}

export type TreeExplorerState<Leaf extends TreeLeaf> = {
  explored: TreeNode<Leaf>[]
  toExplore: TreeNode<Leaf>[]
}
