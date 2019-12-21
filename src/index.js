'use strict'


/**
 * INTERNAL
 */

const identity = value => value
const createReaction = type => payload => ({ type, payload })

const isLetterInLowerCase = l => l.toLowerCase() === l
const isLetterInUpperCase = l => !isLetterInLowerCase(l)
const isFunction = functionToCheck => functionToCheck && {}.toString.call(functionToCheck) === '[object Function]'
const domainInitialState = () => ({ allIds: [], byId: {} })

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

const configureReducersDictionary = reducers => {
    const dictionary = {}
    let actionCreatorBuffer = []

    reducers.forEach(arg => {
        if (arg.isActionCreator) {

            actionCreatorBuffer.push(arg)
        } else {

            actionCreatorBuffer.forEach(currentActionCreator => {
                dictionary[currentActionCreator.type] = arg
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

    return wrap
}


/**
 * ACTIONS
 */

/**
 * A reactions creator factory wrapping by dispatch.
 * formatter takes only a word with a-zA-Z$_0-9 symbols.
 */
export const reactions = (
    wrap,
    childrenNames = [],
    config
) => {
    const { formatter, separator, reactionSet } = {
        formatter: camelCaseToConstCase,
        separator: '_',
        reactionSet: [],
        ...config,
    }
    childrenNames.forEach(childName => {
        reactionSet[ childName ] = []
    })

    return new Proxy({}, {
        get(_, prop) {
            const propForLog = formatter(prop)
            const reactionCreator = createReaction(propForLog)

            const dispatchReaction = (...args) => wrap.dispatchProvider.dispatch(reactionCreator(...args))
            dispatchReaction.type = propForLog
            dispatchReaction.isActionCreator = true

            reactionSet.push(dispatchReaction)

            childrenNames.forEach(name => {
                const childPropForLog = propForLog + separator + formatter(name)
                const childReactionCreator = createReaction(childPropForLog)

                dispatchReaction[name] = (...args) => wrap.dispatchProvider.dispatch(childReactionCreator(...args))
                dispatchReaction[name].type = childPropForLog
                dispatchReaction[name].isActionCreator = true

                reactionSet[name].push(dispatchReaction[name])
            })

            return dispatchReaction
        }
    })
}

export const createReactionSet = () => []


/**
 * REDUCERS
 */

export const createReducer = (initialStateOrInitFunction) => (...args) => {
    const initialState = isFunction(initialStateOrInitFunction)
        ? initialStateOrInitFunction(domainInitialState())
        : initialStateOrInitFunction
    const dictionary = configureReducersDictionary(args)

    return (state = initialState, action) => {
        const handler = dictionary[action.type]

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

export const createSelect = (getSubState = identity) => {
    const all = getSubState
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