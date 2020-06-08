import { createWrap, Wrapper } from "../src/index"


export const createWrapDispatch = (): [ Wrapper, any ] => {
    const wrap = createWrap()
    const dispatch = (obj: any) => obj
    const fakeStore = wrap({
        dispatch
    })

    return [ wrap, dispatch ]
}