import { useReactiveUndo } from 'react-reactive-hooks';

const Todo: React.FC = () => {
  const { redo, state, undo } = useReactiveUndo({
    input: '',
    // Only to show that nested objects are supported
    nested: {
      todos: [
        {
          id: 1,
          text: 'Learn React',
          completed: true,
        },
      ],
    },
  });

  const {
    nested: { todos },
  } = state;

  return (
    <>
      <div>
        {todos.map((todo) => (
          <div key={todo.id}>
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={(e) => {
                todo.completed = e.target.checked;
              }}
            />
            <span>{todo.text}</span>
          </div>
        ))}
      </div>

      <input
        type="text"
        value={state.input}
        onChange={(e) => {
          state.input = e.target.value;
        }}
      />
      <button
        type="button"
        onClick={() => {
          todos.push({
            id: Date.now(),
            text: state.input,
            completed: false,
          });
        }}>
        Add Todo
      </button>

      <button type="button" onClick={undo}>
        Undo
      </button>

      <button type="button" onClick={redo}>
        Redo
      </button>
    </>
  );
};

export default Todo;
