"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSelect = exports.set = exports.merge = exports.createReducer = exports.createReactionSet = exports.reactions = exports.createWrap = void 0;
/**
 * INTERNAL
 */
const identity = (value) => value;
function createReaction(type, payload) {
    return {
        type, payload
    };
}
const isLetterInLowerCase = (l) => l.toLowerCase() === l;
const isLetterInUpperCase = (l) => !isLetterInLowerCase(l);
const isFunction = (functionToCheck) => functionToCheck && {}.toString.call(functionToCheck) === '[object Function]';
const isReplaceHandler = (handler) => !!handler.replaceBy;
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
const createWrap = () => {
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
exports.createWrap = createWrap;
/**
 * ACTIONS
 */
/**
 * A reactions creator factory wrapping by dispatch.
 * formatter takes only a word with a-zA-Z$_0-9 symbols.
 */
const reactions = (wrap, childrenNames, config) => {
    const { formatter, separator, reactionSet } = Object.assign({ formatter: camelCaseToConstCase, separator: '_', reactionSet: [] }, config);
    childrenNames && childrenNames.forEach(childName => {
        reactionSet[childName] = [];
    });
    return new Proxy({}, {
        get(_, prop) {
            const propForLog = formatter(prop.toString());
            const dispatchReaction = (payload) => wrap.dispatchProvider.dispatch(createReaction(propForLog, payload));
            dispatchReaction.type = propForLog;
            dispatchReaction.isActionCreator = true;
            reactionSet.push(dispatchReaction);
            childrenNames && childrenNames.forEach(name => {
                const childPropForLog = propForLog + separator + formatter(name);
                dispatchReaction[name] = (payload) => wrap.dispatchProvider.dispatch(createReaction(childPropForLog, payload));
                dispatchReaction[name].type = childPropForLog;
                dispatchReaction[name].isActionCreator = true;
                reactionSet[name].push(dispatchReaction[name]);
            });
            return dispatchReaction;
        }
    });
};
exports.reactions = reactions;
const createReactionSet = () => [];
exports.createReactionSet = createReactionSet;
/**
 * REDUCERS
 */
const createReducer = (initialStateOrInitFunction = identity) => (...branchOrReactionOrState) => {
    const initialState = isFunction(initialStateOrInitFunction)
        ? initialStateOrInitFunction(domainInitialState())
        : initialStateOrInitFunction;
    const dictionary = configureReducersDictionary(branchOrReactionOrState);
    return (state = initialState, action) => {
        const handler = dictionary[action.type];
        if (!handler)
            return state;
        if (isReplaceHandler(handler)) {
            if (isFunction(handler.replaceBy)) {
                return handler.replaceBy(state, action);
            }
            else {
                return handler.replaceBy;
            }
        }
        const newSlice = handler.reduce(state, action);
        return Object.assign(Object.assign({}, state), newSlice);
    };
};
exports.createReducer = createReducer;
const merge = (handler) => {
    return {
        reduce: handler
    };
};
exports.merge = merge;
const set = (state) => {
    return {
        replaceBy: state
    };
};
exports.set = set;
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
