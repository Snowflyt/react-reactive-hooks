import useReactive from './useReactive';
import cloneDeep from 'lodash.clonedeep';
import { useRef } from 'react';

/**
 * A hook that returns a reactive object and functions to undo and redo changes.
 * @param initialState The initial state of the object.
 * @returns
 */
const useReactiveUndo = <T extends object>(initialState: T) => {
  // The past and future arrays are used to store the state of the object
  const past = useRef<T[]>([]);
  const future = useRef<T[]>([]);
  // Flags to avoid adding undo/redo actions to the past/future arrays
  const justUndo = useRef(false);
  const justRedo = useRef(false);

  const state = useReactive(
    { value: initialState },
    {
      onStateChange: (oldState) => {
        if (justUndo.current) {
          justUndo.current = false;
          return;
        }
        if (justRedo.current) {
          justRedo.current = false;
          return;
        }

        past.current.push(oldState.value);
        future.current = [];
      },
    },
  );

  const undo = () => {
    if (past.current.length === 0) return;

    // Flag to avoid adding undo action to the past array
    justUndo.current = true;

    const lastState = past.current.pop();
    if (lastState) {
      // Deep clone the state to avoid some issues caused by immer
      future.current.push(cloneDeep(state.value));
      state.value = lastState;
    }
  };

  const redo = () => {
    if (future.current.length === 0) return;

    // Flag to avoid adding redo action to the future array
    justRedo.current = true;

    const nextState = future.current.pop();
    if (nextState) {
      // Deep clone the state to avoid some issues caused by immer
      past.current.push(cloneDeep(state.value));
      state.value = nextState;
    }
  };

  return { state: state.value, undo, redo };
};

export default useReactiveUndo;
