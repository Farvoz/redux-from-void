import { createReactionSet, createReducer, reactions } from "../src/index"
import { createWrapDispatch } from "./helpers"


describe('createReducer', () => {
    const [ wrap ] = createWrapDispatch()

    interface State {
        someKey: string,
        newKey: number,
        andOther: any[]
    }

    const initState: State = {
        someKey: 'someValue', 
        newKey: 0,
        andOther: [] 
    }

    const nextState: State = {
        someKey: '',
        newKey: 1,
        andOther: []
    }

    type ResetReaction = {
        type: 'resetReaction'
        payload: never
    }
    type StringReaction = {
        type: 'stringReaction',
        payload: never
    }
    type NumberReaction = {
        type: 'numberReaction',
        payload: number
    }
    type ObjectReaction = {
        type: 'objectReaction',
        payload: object
    }
    type ReactionOneArg = {
        type: 'reactionOneArg',
        payload: never
    }

    const {
        resetReaction,
        stringReaction,
        numberReaction,
        objectReaction,
        reactionOneArg
    } = reactions<ResetReaction | StringReaction | NumberReaction | ObjectReaction | ReactionOneArg>(wrap)

    test('without a first argument', () => {
        const reducer = createReducer()()

        expect(reducer).toBeInstanceOf(Function)
        expect(reducer(initState, resetReaction())).toBe(initState)
    })

    test('a state after a reducer calling', () => {
        const reducer = createReducer<State>(nextState)(
            resetReaction,
            nextState,

            stringReaction,
            () => ({
                someKey: 'string'
            }),

            numberReaction,
            (state, { payload }) => () => ({
                someKey: state.someKey,
                newKey: payload,
                andOther: [ 'andOther' ]
            }),

            objectReaction,
            (_, { payload: { andOther } }) => ({ andOther }),

            reactionOneArg,
            (state: State) => ({ someKey: state.someKey })
        )

        expect(reducer(initState, resetReaction())).toEqual(nextState)
        expect(reducer(initState, stringReaction())).toEqual({ 
            ...initState,
            someKey: 'string'
        })
        expect(reducer(initState, objectReaction({ andOther: [ 'yeah!' ] }))).toEqual(
            { ...initState, andOther: [ 'yeah!' ] }
        )

        expect(reducer(
            reducer(initState, resetReaction()),
            numberReaction(123)
        )).toEqual({
            ...nextState,
            newKey: 123,
            andOther: [ 'andOther' ]
        })
    })

    test('an array of reactions', () => {
        interface State {
            count: number
        }
        const nextState: State = { count: 0 }
        const $et = createReactionSet()

        type ResetReaction = {
            type: 'reset'
            payload: never
        }
        type Reaction1 = {
            type: 'reaction1'
            payload: never
        }
        type Reaction2 = {
            type: 'reaction2'
            payload: never
        }

        type DoneSubReation = {
            type: 'done'
            payload: never
        }
        const {
            reset,
            reaction1,
            reaction2
        } = reactions<ResetReaction | Reaction1 | Reaction2, DoneSubReation>(wrap, [ 'done' ], { reactionSet: $et })

        const {
            reactionWithoutSet
        } = reactions(wrap, [ 'ww' ])

        const handler = ({ count }: State) => ({ count: count + 1 })
        const handler2 = ({ count }: State) => ({ count: count + 10 })

        const reducer = createReducer<State>(nextState)(
            ...$et,
            handler,

            ...$et.done,
            handler2,

            reset,
            reactionWithoutSet.ww,
            nextState
        )

        const newState1 = reducer(
            reducer(nextState, reaction1()),
            reaction2()
        )

        expect(newState1).toEqual({ count: 2 })

        const newState2 = reducer(newState1, reaction2.done())

        expect(newState2).toEqual({ count: 12 })
        expect(reducer(newState2, reset())).toEqual(nextState)
    })
})