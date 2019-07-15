The boilerplate killer for Redux.

## About
The package is in early development. Please don't use it in production.

## Developer Experience

The main goal of this package is to improve developer experience.

## Installation

To install the stable version:

```
yarn add redux-from-void
```

## Preparation
```js
import { createStore } from 'redux'
import { createWrap } from 'redux-from-void'
import rootReducer from './reducers'


// Creating a wrap.
export const wrap = createWrap()


// Wrap our store.
function configureStore(preloadedState) {
    
    return wrap(createStore(rootReducer, preloadedState))
}

export default configureStore
```

## Using
### Actions
#### A Simple Action
```js
import { reactions } from 'redux-from-void'
import { wrap } from './configureStore'


// Create reactions(). This is an action factory. First argument must be wrap().
const {
    pageLoaded,
} = reactions(wrap)

// And export.
export { pageLoaded }


// Now we can dispatch the action without compose() with redux dispatch().
// In Redux DevTools it will be the action with PAGE_LOADED type.
pageLoaded()
```

#### An Action With Children
```js
import { reactions } from 'redux-from-void'
import { wrap } from './configureStore'


// Create reactions(). This is an action factory. First argument must be wrap().
// Second argument is an array of a name for children.
const {
    login
} = reactions(wrap, [ 'succeeded', 'failed' ]);

// And export.
export { login }


// Now we can dispatch the action and its children.
login()             // LOGIN
login.succeeded()   // LOGIN_SUCCEEDED
login.failed()      // LOGIN_FAILED
```

#### Dispatching An Action
Flux architecture. https://github.com/redux-utilities/flux-standard-action
```js
action()                            // { type: 'ACTION',             payload: undefined        }
actionWithValue('value')            // { type: 'ACTION_WITH_VALUE',  payload: 'value'          }
actionWithObject({ key: 'value' })  // { type: 'ACTION_WITH_OBJECT', payload: { key: 'value' } }
action.child([ 1,2,3 ])             // { type: 'ACTION_CHILD',       payload: [ 1,2,3 ]        }

action.type                         // ACTION
actionWithValue.type                // ACTION_WITH_VALUE
actionWithObject.type               // ACTION_WITH_OBJECT
action.child.type                   // ACTION_CHILD
```
#### A Reaction Set
Sometimes there is need for a set of reactions and its children.
```js
import { createReactionSet, reactions } from 'redux-from-void'


const $et = createReactionSet()                            

const {
    login,
    logout
} = reactions(wrap, [ 'succeeded', 'failed' ], { reactionSet: $et });

// $et             equals [ login,           logout           ]
// $et.succeeded   equals [ login.succeeded, logout.succeeded ] 
// $et.failed      equals [ login.failed,    logout.failed    ]
```

#### Additional params
```js
reactions(wrap, [], {
    formatter: camelCaseToConstCase,  // The function for fomatting an action type.
    separator: '_',                   // The separator between main and child name of a reaction. 
    reactionSet: []                   // $et
})
```

## Reducers
### A Simple Reducer
Reducer is a smart reducer. It merges state and prev state into one.
```js
import { createReducer } from 'redux-from-void'


const initialState = {
    isEditableMode: false
}


// The first argument must be an initialState.
const reducer = createReducer(initialState)(
    // Every sequence of arguments contains:
    //   1. one or more actions from reactions();
    //   2. branch (handler).
    // The branch finish sequence. Every branch must return an object that will be merge to prev state.

    editableModeToggled,                                 // This is an action.
    state => ({ isEditableMode: !state.isEditableMode }) // This is a branch.
    
    editableModeSetted,
    (_, { payload: newValue }) => ({ isEditableMode: newValue })
    
    anotherAction,                                      // action
    anotherAction2,                                     // action
    anotherAction3,                                     // action
    () => initialState,                                 // One branch for multi actions. 
)
```
### Default initial state
By default createReducer will create a reducer with initialState  ```{ allIds: [], byId: {} }```
```js
const reducer = createReducer()(...)
```
If createReducer takes function it will be calling with default initialState
```js
const initFunction = initialState => ...anotherState

const reducer = createReducer(initFunction)(...)
```

### Types Of Branches
- Branch is an object (set without merge).
```js
...

action,
{ ... },

...
```

- Branch is a function that return an object (merge).
```js
// The first argument is a prev state, the second one is an action.
...

action,
(state, { payload }) => ({ ... })

...

```
- Branch is a function that return an another function that return an object (set without merge).
```js
// The first argument is a prev state, the second one is an action.
...

action,
(state, { payload }) => () => ({ ... })

...
```

## Selectors
### A Simple Selector
```createSelect``` return tuple of:
1. ```forSelect``` A service function. Must be calling with an initialState.
2. ```select```    A core selector with selectors for every keys in an initialState. 
```js
import { createSelect } from 'redux-from-void'


// createSelect() takes a function that return a slice of the state. 
export const [ forSelect, select ] = createSelect(state => state.someReducer)

// Decorate the initialState. After that select will has selectors for every properties.
const initialState = forSelect({
    property1: false,
    property2: 100
})

// State:
const globalState = {
    ...
    someReducer: {
         property1: false,
         property2: 100
    }
}


// Using
select(globalState)            // { property1: false, property2: 100 } 
select.property1(globalState)  // false
select.property2(globalState)  // 100
```

### A Smart Selector
```js
import { createSelect } from 'redux-from-void'


export const [ forSelect, selectEntity ] = createSelect(state => state.domainReducer)

const initialState = forSelect({
    byId: [],
    allIds: {}
})

// State:
const globalState = {
    ...
    domainReducer: {
        allIds: [ 1 ],
        byId: {
            1: {
                key: 'value'
            }
        }
    }
}

// The second argument is an entity id.
selectEntity(globalState)              // { allIds: [ 1 ], byId: { 1: { key: 'value' } } }
selectEntity.byId(globalState, 1).key  // 'value'
selectEntity.allIds(globalState)       // [ 1 ]
```

### Reducer with a selecor init function
```createReducer``` may takes an init function instead an initial state
```js
import { createSelect, createReducer } from 'redux-from-void'


export const [ forSelect, selectEntity ] = createSelect(state => state.domainReducer)

const reducer = createReducer(forSelect)(...)

// State:
const globalState = {
    ...
    domainReducer: {
        allIds: [],
        byId: {}
    }
}

...

selectEntity(globalState)              // { allIds: [], byId: {} }
```


To be continue...

## License

MIT
