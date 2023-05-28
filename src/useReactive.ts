import { produce } from 'immer';
import { useCallback, useRef, useState } from 'react';

import { Reactive } from './types';

/**
 * Produce a new state from the old state and a list of path and values.
 * @param state The old state.
 * @param pathAndValues A list of path and values.
 * @returns
 */
const produceNewState = <T>(
  state: T,
  pathAndValues: Array<[Array<string | symbol>, unknown]>,
) =>
  produce(state, (draft) => {
    for (const [path, value] of pathAndValues) {
      let current = draft;
      const pathLength = path.length;
      for (const key of path.slice(0, pathLength - 1)) {
        current = current[key as keyof typeof current] as typeof current;
      }
      current[path[pathLength - 1] as keyof typeof current] =
        value as (typeof current)[keyof typeof current];
    }
  });

/**
 * Options for `useReactive` hook.
 */
export interface UseReactiveOptions<T> {
  /**
   * A callback function that will be called when the state is changed.
   * @param oldState
   * @param newState
   * @returns
   */
  onStateChange?: (oldState: T, newState: T) => void;
}

/**
 * A hook that returns a reactive state.
 * @param initialState The initial state.
 * @param options Options.
 * @returns
 *
 * @example
 * ```tsx
 * const state = useReactive({ count: 0 });
 * ...
 * <div>{state.count}</div>
 * <button onClick={() => state.count++}>+</button>
 * ...
 * ```
 * See more on [GitHub](https://github.com/Snowfly-T/react-reactive-hooks).
 */
const useReactive = <T extends object>(
  initialState: T | (() => T),
  options: UseReactiveOptions<T> = {},
): Reactive<T> => {
  const state = useRef(
    typeof initialState === 'function' ? initialState() : initialState,
  );

  // The normally used temp when all keys of the path are strings
  // The search is O(1) because the key is a string
  const tempValuesWithStringPath = useRef(new Map<string, unknown>());
  // The temp used when there is at least one key of the path is a symbol
  // It is used because Symbol does not support string conversion,
  // so `path.join('.')` will throw an error when the path contains a symbol
  // and it can't be used as the key of `tempValuesWithStringPath`
  // Simply using the description of the symbol as the key is not safe,
  // because the description of two different symbols may be the same,
  // so using the path array as key with O(n) search is the only way
  const tempValuesWithSymbolPath = useRef(
    new Map<Array<string | symbol>, unknown>(),
  );

  // A flag that indicates whether the state is changed
  const isDirty = useRef(false);

  const [v, forceUpdate] = useState(false);

  /**
   * Get the cached value from the temp.
   * O(1) when all keys of the path are strings,
   * and O(n) when there is at least one key of the path is a symbol.
   * @param path The path of the value.
   */
  const getCachedValue = useCallback((path: Array<string | symbol>) => {
    // When there is at least one key of the path is a symbol,
    // use `tempValuesWithSymbolPath` to get the value
    // The search is O(n) because the key is an array
    if (path.some((k) => typeof k === 'symbol')) {
      for (const [cachedPath, value] of tempValuesWithSymbolPath.current) {
        if (cachedPath.length !== path.length) continue;
        if (cachedPath.every((k, i) => k === path[i])) return value;
      }
      return;
    }

    // When all keys of the path are strings,
    // use `tempValuesWithStringPath` to get the value
    // The search is O(1)
    return tempValuesWithStringPath.current.get(path.join('.'));
  }, []);

  /**
   * Schedule an update to the state.
   * @param path The path of the value.
   * @param value The new value.
   */
  const scheduleUpdate = useCallback(
    (path: Array<string | symbol>, value: unknown) => {
      isDirty.current = true;

      // When there is at least one key of the path is a symbol,
      // use `tempValuesWithSymbolPath` to cache the value
      // The search is O(n) because the key is an array
      if (path.some((k) => typeof k === 'symbol')) {
        for (const cachedPath of tempValuesWithSymbolPath.current.keys()) {
          if (cachedPath.length < path.length) continue;
          if (cachedPath.every((k, i) => k === path[i])) {
            tempValuesWithSymbolPath.current.set(cachedPath, value);
            return;
          }
        }
        tempValuesWithSymbolPath.current.set(path, value);
        return;
      }

      // When all keys of the path are strings,
      // use `tempValuesWithStringPath` to cache the value
      // The search is O(1)
      tempValuesWithStringPath.current.set(path.join('.'), value);

      forceUpdate(!v);
    },
    [v],
  );

  /**
   * Batch update the state.
   */
  const batchUpdate = useCallback(() => {
    // Calculate the new state and clear the temps
    const pathAndValues = [...tempValuesWithSymbolPath.current.entries()];
    tempValuesWithSymbolPath.current.clear();
    for (const [path, value] of tempValuesWithStringPath.current) {
      pathAndValues.push([path.split('.'), value]);
    }
    tempValuesWithStringPath.current.clear();
    const newState = produceNewState(state.current, pathAndValues);

    // Set the dirty flag to false to avoid unnecessary updates
    isDirty.current = false;

    // An optional callback function can be called when the state is changed
    options.onStateChange?.(state.current, newState);

    state.current = newState;
  }, [options.onStateChange]);

  /**
   * Proxy an object (except for arrays and functions).
   * @param obj The object to be proxied.
   * @param path The path of the object on the state.
   */
  const proxyObject = useCallback(
    <T extends object>(obj: T, path: Array<string | symbol> = []): T =>
      new Proxy(
        // If the object is frozen, it can't be proxied,
        // so a new object is created to be proxied
        Object.isFrozen(obj) ? { ...obj } : obj,
        {
          get(target, key) {
            // Get the value from the cache (if exists) or the object
            const prop =
              getCachedValue([...path, key]) ??
              target[key as keyof typeof target];

            if (Array.isArray(prop)) {
              return proxyArray(prop, [...path, key]);
            }

            if (typeof prop === 'object' && prop !== null) {
              return proxyObject(prop, [...path, key]);
            }

            return prop;
          },

          set(_, key, value) {
            scheduleUpdate([...path, key], value);
            return true;
          },
        },
      ),
    [getCachedValue, scheduleUpdate],
  );

  /**
   * Proxy an array.
   * @param array The array to be proxied.
   * @param path The path of the array on the state.
   */
  const proxyArray = useCallback(
    <T>(array: T[], path: Array<string | symbol> = []): T[] =>
      new Proxy(
        // If the array is frozen, it can't be proxied,
        // so a new array is created to be proxied
        Object.isFrozen(array) ? [...array] : array,
        {
          get(target, key) {
            // Get the value from the cache (if exists) or the object
            const prop =
              getCachedValue([...path, key]) ??
              target[key as keyof typeof target];

            if (Array.isArray(prop)) {
              return proxyArray(prop, [...path, key]);
            }

            if (typeof prop === 'object' && prop !== null) {
              return proxyObject(prop, [...path, key]);
            }

            // Proxy common array methods that mutate the array
            if (typeof prop === 'function') {
              switch (key) {
                case 'push':
                  return (...items: T[]) => {
                    scheduleUpdate(path, [...array, ...items]);
                    return array.length + items.length;
                  };
                case 'pop':
                  return () => {
                    const newArray = [...array];
                    const value = newArray.pop();
                    scheduleUpdate(path, newArray);
                    return value;
                  };
                case 'shift':
                  return () => {
                    const newArray = [...array];
                    const value = newArray.shift();
                    scheduleUpdate(path, newArray);
                    return value;
                  };
                case 'unshift':
                  return (...items: T[]) => {
                    scheduleUpdate(path, [...items, ...array]);
                    return items.length + array.length;
                  };
                case 'splice':
                  return (
                    start: number,
                    deleteCount: number,
                    ...items: T[]
                  ) => {
                    const newArray = [...array];
                    const value = newArray.splice(start, deleteCount, ...items);
                    scheduleUpdate(path, newArray);
                    return value;
                  };
                case 'sort':
                  return (compareFn?: (a: T, b: T) => number) => {
                    const newArray = [...array];
                    newArray.sort(compareFn);
                    scheduleUpdate(path, newArray);
                    return newArray;
                  };
                case 'reverse':
                  return () => {
                    const newArray = [...array];
                    newArray.reverse();
                    scheduleUpdate(path, newArray);
                    return newArray;
                  };
              }
            }

            return prop;
          },

          set(_, key, value) {
            scheduleUpdate([...path, key], value);
            return true;
          },
        },
      ),
    [getCachedValue, scheduleUpdate],
  );

  // Trigger batch update when state is changed
  if (isDirty.current) {
    batchUpdate();
  }

  return proxyObject(state.current);
};

export default useReactive;
