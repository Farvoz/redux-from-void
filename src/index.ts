'use strict'
import { Action, Dispatch, Reducer, AnyAction } from "redux"


/**
 * TYPES
 */

interface DispatchProvider {
    dispatch: null | Dispatch
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

type ReducerCreator<S> = (
    ...branches: any[]
) => Reducer<S>


interface DomainState {
    allIds: number[]
    byId: object
}

interface DomainStateInitializer<S> {
    (defaultState: DomainState): S
}

interface Handler<S> {
    (state: S, action: AnyAction): Partial<S>
}
interface ReplaceHandler<S> {
    (state: S, action: AnyAction): () => S
}

interface HandlerDictionary<S> {
    [ key: string ]: Handler<S> | ReplaceHandler<S> | S | undefined
}


/**
 * INTERNAL
 */

const identity = value => value
const defaultReactionCreator: ReactionCreator = type => payload => ({ type, payload })

const isLetterInLowerCase = l => l.toLowerCase() === l
const isLetterInUpperCase = l => !isLetterInLowerCase(l)
const isFunction = (functionToCheck: any): functionToCheck is Function => 
    functionToCheck && {}.toString.call(functionToCheck) === '[object Function]'
const domainInitialState = () => ({ allIds: [], byId: {} } as DomainState)

const camelCaseToConstCase = str => {
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
    const dispatchProvider = {
        dispatch: null
    }

    const wrap = store => {
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
        get(_, prop) {
            const propForLog = formatter(prop.toString())
            const reactionCreator = createReaction(propForLog)

            const dispatchReaction: any = (...args) => 
                wrap.dispatchProvider.dispatch(reactionCreator(...args))
            dispatchReaction.type = propForLog
            dispatchReaction.isActionCreator = true

            reactionSet.push(dispatchReaction)

            childrenNames && childrenNames.forEach(name => {
                const childPropForLog = propForLog + separator + formatter(name)
                const childReactionCreator = createReaction(childPropForLog)

                dispatchReaction[name] = (...args) => wrap.dispatchProvider.dispatch(childReactionCreator(...args))
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

export const createReducer = <S>(initialStateOrInitFunction?: S | DomainStateInitializer<S>) => 
    (...branchOrReactionOrState: (Handler<S> | ReplaceHandler<S> | Reaction<any> | SubReaction | S)[]): Reducer<S> => {
    const initialState = isFunction(initialStateOrInitFunction)
        ? initialStateOrInitFunction(domainInitialState())
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

const BY_ID = 'byId'

interface SelectorWrapper<P> {
    (stateSlice: P): P
}

interface StateExtractor<S, P> {
    (state: S): P
}

type UniversalSelector<S, P, K extends keyof P> = {
    (state: any): S
} & {
    [ key in K ]: StateExtractor<S, any>
} & {
    [ BY_ID ]: (state: any, id: number) => any
}

export function createSelect<S, P>(getSubState: StateExtractor<S, P> = identity)
    : [ SelectorWrapper<P>, UniversalSelector<S, P, keyof P> ] {
    const all: any = getSubState
    const defineProperty = (key, value) => Object.defineProperty(all, key, { value })

    return [
        initialState => {
            const keys = Object.keys(initialState)

            keys.forEach(key => {
                switch (key) {
                    case BY_ID:
                        defineProperty(key, (state, id) => {
                            const entity = getSubState(state)[ key ][ id ]

                            // check for null and undefined
                            return entity == null ? {} : entity
                        })
                        break
                    default:
                        defineProperty(key, state => getSubState(state)[ key ])
                }
            })

            return initialState
        },
        all
    ]
}