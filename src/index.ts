'use strict'
import { Action, Dispatch, Reducer, AnyAction, Store } from "redux"


/**
 * TYPES
 */

interface DispatchProvider {
    dispatch: Dispatch
}

export interface Wrapper {
    <S>(store: S): S
    dispatchProvider: DispatchProvider
}

type SubReaction = {
    (payload?: any): Action
    type: string
    isActionCreator: boolean
}

type Reaction<S extends string> = {
    [ key in S ]: SubReaction
} & {
    (payload?: any): Action
    type: string
    isActionCreator: boolean
}

interface ReactionCreator {
    (type: string): (...data: any[]) => any
}

interface ReactionsFactory<S extends string> {
    [ propName: string ]: Reaction<S>
}

type ReactionSet = any

interface ReactionsConfig {
    formatter?: (inputString: string) => string,
    separator?: string,
    reactionSet?: ReactionSet
    createReaction?: ReactionCreator
}

type DomainStateInitializer<S> = (defaultState: S) => S

type Handler<S> = (state: S, action: AnyAction) => Partial<S>

type ReplaceHandler<S> = (state: S, action: AnyAction) => () => S

interface HandlerDictionary<S> {
    [ key: string ]: Handler<S> | ReplaceHandler<S> | S | undefined
}


/**
 * INTERNAL
 */

const identity = <T>(value: T): T => value
const defaultReactionCreator: ReactionCreator = type => payload => ({ type, payload })

const isLetterInLowerCase = (l: string) => l.toLowerCase() === l
const isLetterInUpperCase = (l: string) => !isLetterInLowerCase(l)
const isFunction = (functionToCheck: any): functionToCheck is Function => 
    functionToCheck && {}.toString.call(functionToCheck) === '[object Function]'
const domainInitialState = () => ({ allIds: [], byId: {} })

const camelCaseToConstCase = (str: string) => {
    let res = ''

    let isPrevLetterInDowncase = false
    for (let l of str){
        if (isLetterInUpperCase(l) && isPrevLetterInDowncase) {
            res += ('_' + l)
        } else {
            res += l.toUpperCase()
        }

        isPrevLetterInDowncase = isLetterInLowerCase(l)
    }

    return res
}

const isReaction = <S extends string>(entity: any): entity is (Reaction<S> | SubReaction) => 
    !!entity.isActionCreator

const configureReducersDictionary = <S>(
    branchOrReactionOrState: (Handler<S> | ReplaceHandler<S> | Reaction<any> | SubReaction | S)[]
) => {
    const dictionary: HandlerDictionary<S> = {}
    let actionCreatorBuffer: (Reaction<any> | SubReaction)[] = []

    branchOrReactionOrState.forEach(brs => {
        if (isReaction(brs)) {
            actionCreatorBuffer.push(brs)
        } else {
            actionCreatorBuffer.forEach(currentActionCreator => {
                dictionary[ currentActionCreator.type ] = brs
            });
            actionCreatorBuffer = []
        }
    })

    return dictionary
}

/**
 * FOR EXPORT:
 */

/**
 * PREPARATION
 */

/**
 * Creates the main function: wrap. Example: const store = wrap(configureStore()).
 */
export const createWrap = () => {
    const dispatchProvider: { dispatch: null | Dispatch } = {
        dispatch: null
    }

    const wrap = (store: Store) => {
        dispatchProvider.dispatch = store.dispatch
        return store
    }

    wrap.dispatchProvider = dispatchProvider

    return wrap as Wrapper
}


/**
 * ACTIONS
 */


/**
 * A reactions creator factory wrapping by dispatch.
 * formatter takes only a word with a-zA-Z$_0-9 symbols.
 */
export const reactions = <S extends string>(
    wrap: Wrapper,
    childrenNames?: S[],
    config?: ReactionsConfig
) => {
    const { formatter, separator, reactionSet, createReaction } = {
        formatter: camelCaseToConstCase,
        separator: '_',
        reactionSet: [],
        createReaction: defaultReactionCreator,
        ...config,
    }
    childrenNames && childrenNames.forEach(childName => {
        reactionSet[ childName ] = []
    })

    return new Proxy({}, {
        get(_: any, prop: string) {
            const propForLog = formatter(prop.toString())
            const reactionCreator = createReaction(propForLog)

            const dispatchReaction: any = (...args: any[]) => 
                wrap.dispatchProvider.dispatch(reactionCreator(...args))
            dispatchReaction.type = propForLog
            dispatchReaction.isActionCreator = true

            reactionSet.push(dispatchReaction)

            childrenNames && childrenNames.forEach(name => {
                const childPropForLog = propForLog + separator + formatter(name)
                const childReactionCreator = createReaction(childPropForLog)

                dispatchReaction[name] = (...args: any[]) => wrap.dispatchProvider.dispatch(childReactionCreator(...args))
                dispatchReaction[name].type = childPropForLog
                dispatchReaction[name].isActionCreator = true

                reactionSet[name].push(dispatchReaction[name])
            })

            return dispatchReaction as Reaction<S>
        }
    }) as ReactionsFactory<S>
}

export const createReactionSet = () => [] as ReactionSet


/**
 * REDUCERS
 */

export const createReducer = <S>(initialStateOrInitFunction: S | DomainStateInitializer<S> = identity) => 
    (...branchOrReactionOrState: (Handler<S> | ReplaceHandler<S> | Reaction<any> | SubReaction | S)[]): Reducer<S> => {
    const initialState = isFunction(initialStateOrInitFunction)
        ? initialStateOrInitFunction(domainInitialState() as any)
        : initialStateOrInitFunction
    const dictionary = configureReducersDictionary(branchOrReactionOrState)

    return (state = initialState, action) => {
        const handler = dictionary[ action.type ]

        if (!handler)
            return state

        if (!isFunction(handler))
            return handler

        const newSlice = handler(state, action)

        if (isFunction(newSlice))
            return newSlice()

        return {
            ...state,
            ...newSlice
        }
    }
}


/**
 * SELECTORS
 */

type SelectorWrapper<Slice> = (stateSlice: Slice) => Slice

type StateExtractor<State, R> = (state: State) => R

type UniversalSelector<State, Slice> = {
    (state: State): Slice
} & {
    [ key in keyof Slice ]: StateExtractor<State, Slice[ key ]>
}

type Selector<State> = (state: State) => any

export function createSelect<State, Slice extends { [ key: string ]: any }>(
    getSubState: StateExtractor<State, Slice>
): [ SelectorWrapper<Slice>, UniversalSelector<State, Slice> ] {
    const all: any = getSubState
    const defineProperty = <State>(key: string, selector: Selector<State>): void => 
        Object.defineProperty(all, key, { value: selector })

    return [
        initialState => {
            const keys = Object.keys(initialState)

            keys.forEach(key => {
                defineProperty(key, (state: State) => {
                    const slice = getSubState(state)
                    
                    return slice[ key ]
                })
            })

            return initialState
        },
        all
    ]
}