import { Dispatch, Reducer, AnyAction } from "redux";
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
export declare type FindedType<A, T> = Extract<A, {
    type: T;
}>;
declare type WithPayload<A, P> = (payload: P) => A;
declare type WithoutPayload<A> = () => A;
declare type SubReaction<A extends {
    type: string;
    payload: any;
}> = {
    type: string;
    isActionCreator: boolean;
} & (A['payload'] extends never ? WithoutPayload<A> : WithPayload<A, A['payload']>);
export declare type Reaction<A extends {
    type: string;
    payload: any;
}, U extends {
    type: string;
    payload: any;
}> = {
    type: A['type'];
    isActionCreator: boolean;
} & (A['payload'] extends never ? WithoutPayload<A> : WithPayload<A, A['payload']>) & {
    [K in U['type']]: SubReaction<{
        type: K;
        payload: FindedType<U, K>['payload'];
    }>;
};
declare type ReactionSet = any;
interface ReactionsConfig {
    formatter?: (inputString: string) => string;
    separator?: string;
    reactionSet?: ReactionSet;
}
declare type DomainStateInitializer<S> = (defaultState: S) => S;
declare type ReduceHandler<S> = (state: S, action: AnyAction) => Partial<S>;
declare type Handler<S> = {
    reduce: ReduceHandler<S>;
};
declare type ReplaceHandlerS<S> = {
    replaceBy: S;
};
declare type ReplaceHandler<S> = (state: S, action: AnyAction) => S;
declare type ReplaceHandlerReduce<S> = {
    replaceBy: ReplaceHandler<S>;
};
declare type ReplaceHandlerDescriptor<S> = ReplaceHandlerS<S> | ReplaceHandlerReduce<S>;
declare type Branch<S> = Handler<S> | ReplaceHandlerDescriptor<S> | Reaction<any, any> | SubReaction<any>;
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
export declare const reactions: <A extends {
    type: string;
    payload: any;
}, U extends {
    type: string;
    payload: any;
} = any>(wrap: Wrapper, childrenNames?: string[] | undefined, config?: ReactionsConfig | undefined) => { [T in A["type"]]: Reaction<{
    type: T;
    payload: Extract<A, {
        type: T;
    }>["payload"];
}, U>; };
export declare const createReactionSet: () => any;
/**
 * REDUCERS
 */
export declare const createReducer: <S>(initialStateOrInitFunction?: S | DomainStateInitializer<S>) => (...branchOrReactionOrState: Branch<S>[]) => Reducer<S, AnyAction>;
export declare const merge: <S>(handler: ReduceHandler<S>) => Handler<S>;
export declare const set: <S>(state: S | ReplaceHandler<S>) => ReplaceHandlerDescriptor<S>;
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
