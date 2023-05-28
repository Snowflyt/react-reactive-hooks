import { useReactiveStore } from 'react-reactive-hooks';

import globalStore from './store';

const Count = () => {
  const store = useReactiveStore(globalStore);

  return (
    <>
      <div>Count: {store.count}</div>
      <button
        onClick={() => {
          store.count++;
          store.count++;
          store.count++;
        }}>
        Count+++
      </button>
    </>
  );
};

export default Count;
