import reactive from './reactive';
import {
  ReactiveProvider,
  createReactiveStore,
  useReactiveStore,
} from './store';
import useReactive from './useReactive';
import useReactiveUndo from './useReactiveUndo';
import useReactiveValue from './useReactiveValue';

import type { ReactiveStore } from './store';
import type { UseReactiveOptions } from './useReactive';

export type { ReactiveStore, UseReactiveOptions };
export {
  reactive,
  useReactive,
  useReactiveValue,
  createReactiveStore,
  ReactiveProvider,
  useReactiveStore,
  useReactiveUndo,
};

export type Reactive<T> = T;

export type ReactiveValue<T> = Reactive<{
  value: T;
}>;
