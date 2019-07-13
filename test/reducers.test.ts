import { createReducer, reactions } from "../index"
import { createWrapDispatch } from "./helpers"


const [ wrap ] = createWrapDispatch()
const initialState = {}

const {
    resetReaction,
    stringReaction,
    numberReaction,
    objectReaction
} = reactions(wrap)


describe('createReducer', () => {
    const prevState = { someKey: 'someValue', andOther: [] }
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

    test('a state after a reducer calling', () => {
        expect(reducer(prevState, resetReaction())).toEqual({})
        expect(reducer(prevState, stringReaction())).toEqual('string')
        expect(reducer(prevState, objectReaction({ andOther: 'yeah!' }))).toEqual({ someKey: 'someValue', andOther: 'yeah!' })

        expect(reducer(
            reducer(prevState, resetReaction()),
            numberReaction(123)
        )).toEqual({ someKey: undefined, newKey: 123 })
    })
})