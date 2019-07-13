import { createReducer, createSelect, reactions } from "../index"
import { createWrapDispatch } from "./helpers"


const [ wrap ] = createWrapDispatch()


describe('selectors', () => {
    const [ forSelect, select ] = createSelect(state => state.profile)


    const initialState = forSelect({
        user: null,
        byId: {}
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