import { createWrap, reactions } from "../index"


const wrap = createWrap()

const dispatch = obj => obj
const fakeStore = wrap({
    dispatch
})

const {
    emptyReaction,
    numberReaction,
    objectReaction
} = reactions(wrap)

const {
    emptyReaction2,
    numberReactionWithCustomChild,
    objectReactionWithCustomChild
} = reactions(wrap, ['custom'])

describe('wrap', () => {
    expect(wrap).toBeInstanceOf(Function)
    expect(wrap.dispatchProvider.dispatch).toBeInstanceOf(Function)
    expect(wrap.dispatchProvider.dispatch).toBe(dispatch)
})


describe('reactions', () => {
    test('initialize', () => {
        [
            emptyReaction,
            numberReaction,
            objectReaction,
            emptyReaction2,
            numberReactionWithCustomChild,
            objectReactionWithCustomChild,
            emptyReaction2.custom,
            numberReactionWithCustomChild.custom,
            objectReactionWithCustomChild.custom
        ].forEach(action => {
            expect(action).toBeInstanceOf(Function)
            expect(action.isActionCreator).toBeTruthy()
        })

        expect(emptyReaction.custom).toBeUndefined()
        expect(emptyReaction2.custom.type).toBe('EMPTY_REACTION2_CUSTOM')
        expect(emptyReaction2.anotherCustom).toBeUndefined()
    })

    test('dispatching main', () => {
        expect(emptyReaction()).toEqual({ type: 'EMPTY_REACTION', payload: undefined })
        expect(emptyReaction2()).toEqual({ type: 'EMPTY_REACTION2', payload: undefined })
        expect(numberReaction(123)).toEqual({ type: 'NUMBER_REACTION', payload: 123 })
        expect(numberReactionWithCustomChild(567)).toEqual({ type: 'NUMBER_REACTION_WITH_CUSTOM_CHILD', payload: 567 })
        expect(objectReaction({ id: 123 })).toEqual({ type: 'OBJECT_REACTION', payload: { id: 123 }})
        expect(objectReactionWithCustomChild({ id: 456 })).toEqual({ type: 'OBJECT_REACTION_WITH_CUSTOM_CHILD', payload: { id: 456 }})
    })

    test('dispatching custom', () => {
        expect(emptyReaction2.custom()).toEqual({ type: 'EMPTY_REACTION2_CUSTOM', payload: undefined })
        expect(numberReactionWithCustomChild.custom(123)).toEqual({ type: 'NUMBER_REACTION_WITH_CUSTOM_CHILD_CUSTOM', payload: 123 })
        expect(objectReactionWithCustomChild.custom({ id: 123 })).toEqual({ type: 'OBJECT_REACTION_WITH_CUSTOM_CHILD_CUSTOM', payload: { id: 123 } })
    })
})