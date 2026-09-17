interface Loading<T> {
  type: 'Loading';
  data?: T;
}
interface Success<T> {
  type: 'Success';
  data: T;
}
interface Error<T> {
  type: 'Error';
  data?: T;
  error?: globalThis.Error;
  message?: string;
}

export type FetchState<T> = Loading<T> | Error<T> | Success<T>;
