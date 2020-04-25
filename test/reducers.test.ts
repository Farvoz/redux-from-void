import { createReactionSet, createReducer, reactions } from "../src/index"
import { createWrapDispatch } from "./helpers"


describe('createReducer', () => {
    const [ wrap ] = createWrapDispatch()

    const initState = { 
        someKey: 'someValue', 
        newKey: 0,
        andOther: [] 
    }

    const nextState = {
        someKey: '',
        newKey: 1,
        andOther: []
    }

    const {
        resetReaction,
        stringReaction,
        numberReaction,
        objectReaction
    } = reactions(wrap)

    test('without a first argument', () => {
        const reducer = createReducer()()

        expect(reducer).toBeInstanceOf(Function)
        expect(reducer(initState, objectReaction())).toBe(initState)
    })

    test('a state after a reducer calling', () => {
        const reducer = createReducer(nextState)(
            resetReaction,
            nextState,

            stringReaction,
            () => ({ someKey: 'string' }),

            numberReaction,
            (state, { payload }) => () => ({ 
                someKey: state.someKey, 
                newKey: payload,
                andOther: [ 'andOther' ]
            }),

            objectReaction,
            (_, { payload: { andOther } }) => ({ andOther })
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
        const nextState = { count: 0 }
        const $et = createReactionSet()
        const {
            reset,
            reaction1,
            reaction2
        } = reactions(wrap, [ 'done' ], { reactionSet: $et })

        const {
            reactionWithoutSet
        } = reactions(wrap, [ 'ww' ])

        const handler = ({ count }) => ({ count: count + 1 })
        const handler2 = ({ count }) => ({ count: count + 10 })

        const reducer = createReducer(nextState)(
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