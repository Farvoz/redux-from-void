'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * INTERNAL
 */
const identity = (value) => value;
const defaultReactionCreator = type => payload => ({ type, payload });
const isLetterInLowerCase = (l) => l.toLowerCase() === l;
const isLetterInUpperCase = (l) => !isLetterInLowerCase(l);
const isFunction = (functionToCheck) => functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
const domainInitialState = () => ({ allIds: [], byId: {} });
const camelCaseToConstCase = (str) => {
    let res = '';
    let isPrevLetterInDowncase = false;
    for (let l of str) {
        if (isLetterInUpperCase(l) && isPrevLetterInDowncase) {
            res += ('_' + l);
        }
        else {
            res += l.toUpperCase();
        }
        isPrevLetterInDowncase = isLetterInLowerCase(l);
    }
    return res;
};
const isReaction = (entity) => !!entity.isActionCreator;
const configureReducersDictionary = (branchOrReactionOrState) => {
    const dictionary = {};
    let actionCreatorBuffer = [];
    branchOrReactionOrState.forEach(brs => {
        if (isReaction(brs)) {
            actionCreatorBuffer.push(brs);
        }
        else {
            actionCreatorBuffer.forEach(currentActionCreator => {
                dictionary[currentActionCreator.type] = brs;
            });
            actionCreatorBuffer = [];
        }
    });
    return dictionary;
};
/**
 * FOR EXPORT:
 */
/**
 * PREPARATION
 */
/**
 * Creates the main function: wrap. Example: const store = wrap(configureStore()).
 */
exports.createWrap = () => {
    const dispatchProvider = {
        dispatch: null
    };
    const wrap = (store) => {
        dispatchProvider.dispatch = store.dispatch;
        return store;
    };
    wrap.dispatchProvider = dispatchProvider;
    return wrap;
};
/**
 * ACTIONS
 */
/**
 * A reactions creator factory wrapping by dispatch.
 * formatter takes only a word with a-zA-Z$_0-9 symbols.
 */
exports.reactions = (wrap, childrenNames, config) => {
    const { formatter, separator, reactionSet, createReaction } = Object.assign({ formatter: camelCaseToConstCase, separator: '_', reactionSet: [], createReaction: defaultReactionCreator }, config);
    childrenNames && childrenNames.forEach(childName => {
        reactionSet[childName] = [];
    });
    return new Proxy({}, {
        get(_, prop) {
            const propForLog = formatter(prop.toString());
            const reactionCreator = createReaction(propForLog);
            const dispatchReaction = (...args) => wrap.dispatchProvider.dispatch(reactionCreator(...args));
            dispatchReaction.type = propForLog;
            dispatchReaction.isActionCreator = true;
            reactionSet.push(dispatchReaction);
            childrenNames && childrenNames.forEach(name => {
                const childPropForLog = propForLog + separator + formatter(name);
                const childReactionCreator = createReaction(childPropForLog);
                dispatchReaction[name] = (...args) => wrap.dispatchProvider.dispatch(childReactionCreator(...args));
                dispatchReaction[name].type = childPropForLog;
                dispatchReaction[name].isActionCreator = true;
                reactionSet[name].push(dispatchReaction[name]);
            });
            return dispatchReaction;
        }
    });
};
exports.createReactionSet = () => [];
/**
 * REDUCERS
 */
exports.createReducer = (initialStateOrInitFunction = identity) => (...branchOrReactionOrState) => {
    const initialState = isFunction(initialStateOrInitFunction)
        ? initialStateOrInitFunction(domainInitialState())
        : initialStateOrInitFunction;
    const dictionary = configureReducersDictionary(branchOrReactionOrState);
    return (state = initialState, action) => {
        const handler = dictionary[action.type];
        if (!handler)
            return state;
        if (!isFunction(handler))
            return handler;
        const newSlice = handler(state, action);
        if (isFunction(newSlice))
            return newSlice();
        return Object.assign(Object.assign({}, state), newSlice);
    };
};
function createSelect(getSubState) {
    const all = getSubState;
    const defineProperty = (key, selector) => Object.defineProperty(all, key, { value: selector });
    return [
        initialState => {
            const keys = Object.keys(initialState);
            keys.forEach(key => {
                defineProperty(key, (state) => {
                    const slice = getSubState(state);
                    return slice[key];
                });
            });
            return initialState;
        },
        all
    ];
}
exports.createSelect = createSelect;
