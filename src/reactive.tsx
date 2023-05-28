import * as React from 'react';

import type { ReactiveValue } from './types';

const reactive =
  <P extends object, VKS extends Array<keyof P>>(
    Component: React.FC<P>,
    valueKeys: VKS,
    updaters: (model: ReactiveValue<P[VKS[number]]>) => Partial<{
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [K in keyof P as Exclude<P[K], undefined> extends (...args: any[]) => any
        ? K
        : never]: P[K];
    }>,
  ): React.FC<P & { model: ReactiveValue<P[VKS[number]]> }> =>
  // eslint-disable-next-line react/display-name
  ({ model, ...props }) => {
    const events = updaters(model);

    return (
      // @ts-expect-error - subtyping is not supported
      <Component
        {...props}
        {...{
          ...valueKeys.reduce(
            (acc, key) => ({
              ...acc,
              [key]: model.value,
            }),
            {},
          ),
          ...events,
        }}
      />
    );
  };

export default reactive;
