import { createReactionSet, reactions } from "../src/index"
import { createWrapDispatch } from "./helpers"


describe('reactions', () => {
    type EmptyAction = {
        type: 'emptyReaction'
        payload: never
    }

    type NumberAction = {
        type: 'numberReaction',
        payload: number
    }

    type ObjectReaction = {
        type: 'objectReaction'
        payload: object
    }

    const [ wrap ] = createWrapDispatch()

    const {
        emptyReaction,
        numberReaction,
        objectReaction
    } = reactions<EmptyAction | NumberAction | ObjectReaction>(wrap)

    type EmptyReaction2 = {
        type: 'emptyReaction2',
        payload: never
    }

    type NumberReactionWithCustomChild = {
        type: 'numberReactionWithCustomChild',
        payload: number
    }

    type ObjectReactionWithCustomChild = {
        type: 'objectReactionWithCustomChild',
        payload: { id: number }
    }

    type CustomSubtype = {
        type: 'custom'
        payload: never
    }

    type Custom2Subtype = {
        type: 'custom2'
        payload: number
    }

    const {
        emptyReaction2,
        numberReactionWithCustomChild,
        objectReactionWithCustomChild
    } = reactions<EmptyReaction2 
        | NumberReactionWithCustomChild 
        | ObjectReactionWithCustomChild
        , CustomSubtype | Custom2Subtype>(wrap, [ 'custom', 'custom2' ])


    test('initialize', () => {
        const rs = [
            emptyReaction,
            numberReaction,
            objectReaction,
            emptyReaction2,
            numberReactionWithCustomChild,
            objectReactionWithCustomChild,
            emptyReaction2.custom,
            emptyReaction2.custom2,
            numberReactionWithCustomChild.custom,
            objectReactionWithCustomChild.custom,
            objectReactionWithCustomChild.custom2
        ]
        rs.forEach(action => {
            expect(action).toBeInstanceOf(Function)
            expect(action.isActionCreator).toBeTruthy()
        })

        expect((emptyReaction as any).custom).toBeUndefined()
        expect(emptyReaction2.custom.type).toBe('EMPTY_REACTION2_CUSTOM')
        expect((emptyReaction2 as any).anotherCustom).toBeUndefined()
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
        expect(numberReactionWithCustomChild.custom()).toEqual({ type: 'NUMBER_REACTION_WITH_CUSTOM_CHILD_CUSTOM', payload: undefined })
        expect(objectReactionWithCustomChild.custom()).toEqual({ type: 'OBJECT_REACTION_WITH_CUSTOM_CHILD_CUSTOM', payload: undefined })
        expect(objectReactionWithCustomChild.custom2(123)).toEqual({ type: 'OBJECT_REACTION_WITH_CUSTOM_CHILD_CUSTOM2', payload: 123 })
    })


    test('a default children set', () => {
        const childName1 = 'failed'
        const childName2 = 'succeeded'
        const $et = createReactionSet()
        const {
            fetchData,
            login,
            logout
        } = reactions(wrap, [ childName1, childName2 ], { reactionSet: $et })

        expect($et).toBeInstanceOf(Array)
        expect($et.map((r: any) => r.type)).toEqual([
            fetchData.type, login.type, logout.type
        ])
        expect($et[ childName1 ].map((r: any) => r.type)).toEqual([
            fetchData[ childName1 ].type, login[ childName1 ].type, logout[ childName1 ].type
        ])
        expect($et[ childName2 ].map((r: any) => r.type)).toEqual([
            fetchData[ childName2 ].type, login[ childName2 ].type, logout[ childName2 ].type
        ])
    })
})