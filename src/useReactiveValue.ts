import useReactive from './useReactive';

import type { ReactiveValue } from './types';

/**
 * A hook that returns a reactive object with a `value` property.
 * @param value The initial value of the `value` property.
 * @returns
 */
const useReactiveValue = <T>(value: T): ReactiveValue<T> => {
  const state = useReactive({ value });

  return new Proxy(state, {
    get: (target, prop) => {
      if (prop === 'value') return target.value;
      return target.value[prop as keyof typeof target.value];
    },

    set: (target, prop, value) => {
      if (prop === 'value') {
        target.value = value;
      } else {
        target.value[prop as keyof typeof target.value] = value;
      }
      return true;
    },
  });
};

export default useReactiveValue;
