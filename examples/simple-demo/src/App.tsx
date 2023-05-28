import { ReactiveProvider } from 'react-reactive-hooks';

import Count from './Count';
import Todo from './Todo';
import globalStore from './store';

import './App.css';

const App: React.FC = () => {
  return (
    <ReactiveProvider store={globalStore}>
      <Count />
      <Todo />
    </ReactiveProvider>
  );
};

export default App;
