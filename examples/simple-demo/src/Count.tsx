import globalStore from './store';
import { useReactiveStore } from 'react-reactive-hooks';

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
        Increment
      </button>
    </>
  );
};

export default Count;
