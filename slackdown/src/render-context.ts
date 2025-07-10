export interface IBlockContextState {
  readonly isInList: boolean
  readonly isInBlockQuote: boolean
  readonly isInCodeBlock: boolean
}

export interface IMarkdownRenderContext {
  readonly currentState: IBlockContextState
  transitionTo(newState: Partial<IBlockContextState>): IBlockContextState
}

export class MarkdownRenderContext implements IMarkdownRenderContext {
  private state: IBlockContextState = {
    isInList: false,
    isInBlockQuote: false,
    isInCodeBlock: false,
  }

  public get currentState(): IBlockContextState {
    return this.state
  }

  public transitionTo(newState: Partial<IBlockContextState>): IBlockContextState {
    const previousState = this.state
    this.state = {
      isInList: false,
      isInBlockQuote: false,
      isInCodeBlock: false,
      ...newState,
    }
    return previousState
  }
}
