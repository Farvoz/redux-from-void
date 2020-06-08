import { createWrapDispatch } from "./helpers"


describe('wrap', () => {
    const [ wrap, dispatch ] = createWrapDispatch()

    test('basic', () => {
        expect(wrap).toBeInstanceOf(Function)
        expect(wrap.dispatchProvider.dispatch).toBeInstanceOf(Function)
        expect(wrap.dispatchProvider.dispatch).toBe(dispatch)
    })
})