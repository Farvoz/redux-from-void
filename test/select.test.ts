import { createReducer, createSelect, reactions } from "../src/index"
import { createWrapDispatch } from "./helpers"


describe('selectors', () => {
    const [ wrap ] = createWrapDispatch()
    const [ forSelect, select ] = createSelect(state => state.profile)


    const initialState = forSelect({
        user: null,
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
        expect(select.user(mainState)).toBe(null)
    })

    test('with pass a select helper into a reducer', () => {
        const [ forReducerSelect, selectEntity ] = createSelect(state => state)
        const reducer = createReducer(forReducerSelect)()

        expect(selectEntity.byId(initialState, 1)).toEqual({ name: 'Vika' })
    })

    const { userLogged } = reactions(wrap)

    const reducer = createReducer(initialState)(
        userLogged,
        () => ({ user: 'Sanya', byId: { 2: { name: 'Slava' }} })
    )

    const mainState = {
        profile: reducer(initialState, userLogged())
    }

    test('select after reducing', () => {
        expect(select.user(mainState)).toEqual('Sanya')
    })

    test('select by id', () => {
        expect(select.byId(mainState, 2).name).toBe('Slava')
        expect(select.byId(mainState, 4).name).toBeUndefined()
    })
})