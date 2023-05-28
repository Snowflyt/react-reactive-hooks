export type Reactive<T> = T;

export type ReactiveValue<T> = Reactive<{
  value: T;
}>;
