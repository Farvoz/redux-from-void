import { Action, Dispatch, Reducer } from "redux"


interface DispatchProvider {
    dispatch: null | Dispatch
}

interface Wrapper {
    <S>(store: S): S
    dispatchProvider: DispatchProvider
}

export function createWrap(): Wrapper

interface Reaction {
    [ child: string ]: any
    (payload?: any): Action
    type: string
    isActionCreator: boolean
}

interface ReactionsFactory {
    [ propName: string ]: Reaction
}

type ReactionSet = any

export function createReactionSet(): ReactionSet

interface ReactionsConfig {
    formatter?: (inputString: string) => string,
    separator?: string,
    reactionSet?: ReactionSet
}

export function reactions(
    wrap: Wrapper,
    childrenNames?: string[],
    config?: ReactionsConfig
): ReactionsFactory

type ReducerCreator<S> = (
    ...branches: any[],
) => Reducer<S>

export function createReducer<S = any>(
    initialStateOrInitFunction?: S | ((defaultState: S) => S)
): ReducerCreator<S>

export const createSelect: any