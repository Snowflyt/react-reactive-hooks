import { createReactiveStore } from 'react-reactive-hooks';

const globalStore = createReactiveStore({
  count: 0,
});

export default globalStore;
