# react-reactive-hooks

A set of React hooks to make your components reactive

## Features

- Reactive state - `useReactive` and `useReactiveValue` like `reactive` and `ref` in Vue 3
- Easy undo/redo - `useReactiveUndo` to undo/redo changes to a reactive state
- Cross component communication - `createReactiveStore` to create a reactive store and `useReactiveStore` to use it
- High performance - Use immer to only update the changed parts of the state and use batched updates to avoid unnecessary re-renders
- Still immutable - Only use immer's `produce` to create a new state
- Nested objects, arrays and destructuring supported - `useReactive` and `useReactiveValue` support nested objects and destructuring, common methods on arrays are also supported like `push`, `splice` and `sort`
- Intuitive API - Updates are triggered immediately (a temporary state is created in each render to trace the changes and a batched update is scheduled at the end of the render). e.g. repeat `state.count++` twice in a render will increment the count by 2, because when you call `state.count++` the first time, the temporary state is updated, and then when getting the value of `state.count`, the temporary state is used instead of the original state, so the second `state.count++` will increment the temporary state instead of the original state. No confusing behavior like repeating `setState(count + 1)` twice actually just increment the count by 1!

## Installation

### npm

```bash
npm install react-reactive-hooks
```

### yarn

```bash
yarn add react-reactive-hooks
```

### pnpm

```bash
pnpm add react-reactive-hooks
```

## Usage

### `useReactive`

You can use `useReactive` to create a reactive state, just like `reactive` in Vue 3.

```tsx
import { useReactive } from 'react-reactive-hooks';

const Counter: React.FC = () => {
  const state = useReactive({
    count: 0,
  });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => state.count++}>+</button>
      <button onClick={() => state.count--}>-</button>
    </div>
  );
};
```

Nested objects are supported:

```tsx
import { useReactive } from 'react-reactive-hooks';

const Todo: React.FC = () => {
  const state = useReactive({
    input: '',
    nested: {
      todos: [] as Array<{
        text: string;
        done: boolean;
      }>,
    },
  });
  const {
    nested: { todos },
  } = state;

  return (
    <>
      <input
        value={state.input}
        onChange={(e) => (state.input = e.target.value)}
      />
      <button
        onClick={() => {
          todos.push({
            text: state.input,
            done: false,
          });
          state.input = '';
        }}>
        Add
      </button>
      <ul>
        {todos.map((todo, index) => (
          <li key={index}>
            <input
              type="checkbox"
              checked={todo.done}
              onChange={(e) => (todo.done = e.target.checked)}
            />
            <span>{todo.text}</span>
          </li>
        ))}
      </ul>
    </>
  );
};
```

As you can see in the proceeding example, common methods on arrays are supported like `push`, `splice` and `sort`. Destructuring is also supported.

`useReactive` uses a temporary state to trace the changes, so changes are triggered immediately. You can even write something like this:

```tsx
const Counter: React.FC = () => {
  const state = useReactive({
    count: 0,
  });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => {
        state.count++;
        console.log(state.count); // 1 (if you use useState, this will be 0)
        state.count++;
        state.count++;
        console.log(state.count); // 3 (if you use useState, this will still be 0)
      }>+++</button>
    </div>
  );
};
```

> **WARNING:** Symbols as keys are supported in `useReactive`, but they are currently not efficient enough. Due to the mechanism of the temporary state in `useReactive`, if you access a value on the state using a symbol as the key, like `state['foo'][Symbol('bar')]['baz']`, the `get` trap of the proxy will fall back to be O(n) instead of O(1), where n is the number of changed properties with keys path containing one or more symbols. So if you have a lot of symbols as keys, you should consider splitting the state into multiple states.

> **WARNING:** Avoid nesting too many objects or arrays in the state, because each time you access a property on the state, the `get` trap of the proxy will be called, and the `get` trap will traverse the path of the property to find the value. For example, `state.foo.bar.baz` will traverse `state` -> `state.foo` -> `state.foo.bar` -> `state.foo.bar.baz` and create new proxies for each object in the path, that's why destructuring is supported. To avoid creating too many proxies and reduce the overhead of deep traversing, you should consider splitting the state into multiple states.

### `useReactiveValue`

`useReactiveValue` provides an alternative API to `useReactive` for creating a simple reactive value. It's just like `ref` in Vue 3.

```tsx
import { useReactiveValue } from 'react-reactive-hooks';

const Counter: React.FC = () => {
  const count = useReactiveValue(0);

  return (
    <div>
      <p>Count: {count.value}</p>
      <button onClick={() => count.value++}>+</button>
      <button onClick={() => count.value--}>-</button>
    </div>
  );
};
```

Note that compared with `ref` in Vue 3, you cannot use something like `<p>Count: {count}</p>` to display the value, because `count` is not a primitive value, it's an object with a `value` property.

### `useReactiveUndo`

`useReactiveUndo` provides an easy way to undo/redo changes to a reactive state.

```tsx
import { useReactiveUndo } from 'react-reactive-hooks';

const Counter: React.FC = () => {
  const { state, undo, redo } = useReactiveUndo({
    count: 0,
  });

  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => state.count++}>+</button>
      <button onClick={() => state.count--}>-</button>
      <button onClick={undo}>Undo</button>
      <button onClick={redo}>Redo</button>
    </div>
  );
};
```

> **WARNING:** `useReactiveUndo` deep clones the state when you call `undo` or `redo` to avoid some unexpected behaviors. So if you have a lot of data in the state, it may be slow.

### `createReactiveStore` and `useReactiveStore`

`createReactiveStore` creates a reactive store and `useReactiveStore` uses it.

```tsx
// globalStore.ts
import { createReactiveStore } from 'react-reactive-hooks';

const globalStore = createReactiveStore({
  count: 0,
});

export default globalStore;

// App.tsx
import { ReactiveProvider } from 'react-reactive-hooks';
import globalStore from './globalStore';
import Counter from './Counter';

const App: React.FC = () => {
  return (
    <ReactiveProvider store={globalStore}>
      <Counter />
    </ReactiveProvider>
  );
};

export default App;

// Counter.tsx
import { useReactiveStore } from 'react-reactive-hooks';
import globalStore from './globalStore';

const Counter: React.FC = () => {
  const store = useReactiveStore(globalStore);

  return (
    <div>
      <p>Count: {store.count}</p>
      <button onClick={() => store.count++}>+</button>
      <button onClick={() => store.count--}>-</button>
    </div>
  );
};

export default Counter;
```
