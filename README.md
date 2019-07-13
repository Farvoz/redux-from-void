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
```
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
```
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
```
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
```
action()                            // { type: 'ACTION',             payload: undefined        }
actionWithValue('value')            // { type: 'ACTION_WITH_VALUE',  payload: 'value'          }
actionWithObject({ key: 'value' })  // { type: 'ACTION_WITH_OBJECT', payload: { key: 'value' } }
action.child([ 1,2,3 ])             // { type: 'ACTION_CHILD',       payload: [ 1,2,3 ]        }

action.type                         // ACTION
actionWithValue.type                // ACTION_WITH_VALUE
actionWithObject.type               // ACTION_WITH_OBJECT
action.child.type                   // ACTION_CHILD
```

#### Additional params
```
reactions(wrap, [], {
    formatter: camelCaseToConstCase,  // The function for fomatting an action type.
    separator: '_'
})
```

## Reducers
### A Simple Reducer
Reducer is a smart reducer. It merges state and prev state into one.
```
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
```
const initialState = { allIds: [], byId: {} }
```

### Types Of Branches
- Branch is an object (set without merge).
```
...

action,
{ ... },

...
```

- Branch is a function that return an object (merge).
```
// The first argument is a prev state, the second one is an action.
...

action,
(state, { payload }) => ({ ... })

...

```
- Branch is a function that return an another function that return an object (set without merge).
```
// The first argument is a prev state, the second one is an action.
...

action,
(state, { payload }) => () => ({ ... })

...
```

## Selectors
### A Simple Selector 
```
import { createSelect } from 'redux-from-void'


// createSelect() takes a function that return a slice of the state. 
export const [ forSelect, select ] = createSelect(state => state.someReducer)

// Decorate the initialState. After that select will has selectors for every properties.
const initialState = forSelect({
    property1: false,
    property2: 100
})


// Using
select.property1(initialState)  // false
select.property2(initialState)  // 100
```

### A Smart Selector
```
export const [ forSelect, selectEntity ] = createSelect((state: any) => state.domainReducer)

const initialState = forSelect({
    byId: [],
    allIds: {}
})


// Using
const someState = {
    allIds: [ 1 ],
    byId: {
        1: {
            key: 'value'
        }
    }
}

// The second argument is an entity id.
selectEntity.byId(someState, 1).key  // 'value'
selectEntity.allIds(someState)       // [ 1 ]
```

To be continue...

## License

MIT
