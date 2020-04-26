import { Action, Dispatch, Reducer, AnyAction } from "redux";
/**
 * TYPES
 */
interface DispatchProvider {
    dispatch: Dispatch;
}
export interface Wrapper {
    <S>(store: S): S;
    dispatchProvider: DispatchProvider;
}
declare type SubReaction = {
    (payload?: any): Action;
    type: string;
    isActionCreator: boolean;
};
declare type Reaction<S extends string> = {
    [key in S]: SubReaction;
} & {
    (payload?: any): Action;
    type: string;
    isActionCreator: boolean;
};
interface ReactionCreator {
    (type: string): (...data: any[]) => any;
}
interface ReactionsFactory<S extends string> {
    [propName: string]: Reaction<S>;
}
declare type ReactionSet = any;
interface ReactionsConfig {
    formatter?: (inputString: string) => string;
    separator?: string;
    reactionSet?: ReactionSet;
    createReaction?: ReactionCreator;
}
declare type DomainStateInitializer<S> = (defaultState: S) => S;
declare type Handler<S> = (state: S, action: AnyAction) => Partial<S>;
declare type ReplaceHandler<S> = (state: S, action: AnyAction) => () => S;
/**
 * FOR EXPORT:
 */
/**
 * PREPARATION
 */
/**
 * Creates the main function: wrap. Example: const store = wrap(configureStore()).
 */
export declare const createWrap: () => Wrapper;
/**
 * ACTIONS
 */
/**
 * A reactions creator factory wrapping by dispatch.
 * formatter takes only a word with a-zA-Z$_0-9 symbols.
 */
export declare const reactions: <S extends string>(wrap: Wrapper, childrenNames?: S[] | undefined, config?: ReactionsConfig | undefined) => ReactionsFactory<S>;
export declare const createReactionSet: () => any;
/**
 * REDUCERS
 */
export declare const createReducer: <S>(initialStateOrInitFunction?: S | DomainStateInitializer<S>) => (...branchOrReactionOrState: (SubReaction | Reaction<any> | S | Handler<S> | ReplaceHandler<S>)[]) => Reducer<S, AnyAction>;
/**
 * SELECTORS
 */
declare type SelectorWrapper<Slice> = (stateSlice: Slice) => Slice;
declare type StateExtractor<State, R> = (state: State) => R;
declare type UniversalSelector<State, Slice> = {
    (state: State): Slice;
} & {
    [key in keyof Slice]: StateExtractor<State, Slice[key]>;
};
export declare function createSelect<State, Slice extends {
    [key: string]: any;
}>(getSubState: StateExtractor<State, Slice>): [SelectorWrapper<Slice>, UniversalSelector<State, Slice>];
export {};
