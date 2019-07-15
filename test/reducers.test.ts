import { createReactionSet, createReducer, reactions } from "../index"
import { createWrapDispatch } from "./helpers"


describe('createReducer', () => {
    const [ wrap ] = createWrapDispatch()
    const initialState = {}

    const {
        resetReaction,
        stringReaction,
        numberReaction,
        objectReaction
    } = reactions(wrap)

    const prevState = { someKey: 'someValue', andOther: [] }

    test('without a first argument', () => {
        const reducer = createReducer()()

        expect(reducer).toBeInstanceOf(Function)
        expect(reducer(prevState, objectReaction())).toBe(prevState)
    })

    test('a state after a reducer calling', () => {
        const reducer = createReducer(initialState)(
            resetReaction,
            initialState,

            stringReaction,
            'string',

            numberReaction,
            (state, { payload }) => () => ({ someKey: state.someKey, newKey: payload }),

            objectReaction,
            (state, { payload: { andOther } }) => ({ andOther })
        )

        expect(reducer(prevState, resetReaction())).toEqual({})
        expect(reducer(prevState, stringReaction())).toEqual('string')
        expect(reducer(prevState, objectReaction({ andOther: 'yeah!' }))).toEqual({ someKey: 'someValue', andOther: 'yeah!' })

        expect(reducer(
            reducer(prevState, resetReaction()),
            numberReaction(123)
        )).toEqual({ someKey: undefined, newKey: 123 })
    })

    test('an array of reactions', () => {
        const initialState = { count: 0 }
        const $et = createReactionSet()
        const {
            reset,
            reaction1,
            reaction2
        } = reactions(wrap, [ 'done' ], { reactionSet: $et })

        const reducer = createReducer(initialState)(
            ...$et,
            ({ count }) => ({ count: count + 1 }),

            reset,
            initialState
        )

        const newState = reducer(
            reducer(initialState, reaction1()),
            reaction2()
        )

        expect(newState).toEqual({ count: 2 })

        expect(reducer(newState, reset())).toEqual(initialState)
    })
})