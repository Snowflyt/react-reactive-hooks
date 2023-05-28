import { createContext, useContext } from 'react';

import useReactive from './useReactive';

/**
 * A wrapper around a React Context and an initial state.
 */
export interface ReactiveStore<T extends object> {
  __Context: React.Context<T>;
  __initialState: T;
}

/**
 * Creates a new store for `useReactiveStore` to use.
 * @param initialState The initial state of the store.
 * @returns
 */
export const createReactiveStore = <T extends object>(
  initialState: T,
): ReactiveStore<T> => ({
  __Context: createContext<T>(initialState),
  __initialState: initialState,
});

/**
 * A React component that provides a store to `useReactiveStore`.
 * @returns
 */
export const ReactiveProvider = <T extends object>({
  children,
  store,
}: {
  store: ReactiveStore<T>;
  children: React.ReactNode[];
}) => {
  const state = useReactive(store.__initialState);

  return (
    <store.__Context.Provider value={state}>
      {children}
    </store.__Context.Provider>
  );
};

/**
 * A React hook that returns the current state of a store.
 * @param store The store to use.
 * @returns
 */
export const useReactiveStore = <T extends object>(store: ReactiveStore<T>) =>
  useContext(store.__Context);
