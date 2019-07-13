import { createReducer, reactions } from "../index"
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
})