import { createReducer, createSelect, reactions } from "../src/index"
import { createWrapDispatch } from "./helpers"


describe('selectors', () => {
    interface StateSlice {
        user: string
        byId: Object
    }
    interface State {
        profile: StateSlice
    }

    const [ wrap ] = createWrapDispatch()
    const [ forSelect, select ] = createSelect<State, StateSlice>(state => state.profile)

    const initialState = forSelect({
        user: 'null',
        byId: {
            1: { name: 'Vika' }
        }
    })

    test('initializing', () => {
        expect(select).toBeInstanceOf(Function)
        expect(select.user).toBeInstanceOf(Function)
    })

    test('simple select', () => {
        const mainState = {
            profile: initialState
        }

        expect(select(mainState)).toBe(initialState)
        expect(select.user(mainState)).toBe('null')
        expect(select.byId(mainState)).toEqual({ 1: { name: 'Vika' } })
        expect(select.byId(mainState)[ 1 ]).toEqual({ name: 'Vika' })
        expect(select.byId(mainState)[ 2 ]).toBeUndefined()
    })

    const { userLogged } = reactions(wrap)
    const reducer = createReducer(initialState)(
        userLogged,
        () => ({ 
            user: 'Sanya', 
            byId: { 2: { name: 'Slava' }} 
        })
    )

    const mainState: State = {
        profile: reducer(initialState, userLogged())
    }

    test('select after reducing', () => {
        expect(select.user(mainState)).toEqual('Sanya')
    })
})