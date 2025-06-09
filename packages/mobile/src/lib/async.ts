import { useState, useEffect } from "react";

export type UsePromiseResult<T> = [false, T] | [true, null];

export function usePromise<T>(promise: Promise<T>): UsePromiseResult<T> {
  const [state, setState] = useState<UsePromiseResult<T>>([true, null]);

  useEffect(() => {
    promise.then((v) => {
      setState([false, v]);
    });
    promise.catch((e) => {
      throw e;
    });
  }, [setState, promise])
  
  return state;
}

export type UsePromiseSafeResult<T> = [false, T, null] | [false, null, Error] | [true, null, null];

export function usePromiseSafe<T>(promise: Promise<T>): UsePromiseSafeResult<T> {
  const [state, setState] = useState<UsePromiseSafeResult<T>>([true, null, null]);

  useEffect(() => {
    promise.then((v) => {
      setState([false, v, null]);
    });
    promise.catch((e) => {
      if (!(e instanceof Error)) {
        e = new Error(`Unknown error: ${e}`);
      }

      setState([false, null, e]);
    });
  }, [setState, promise])
  
  return state;
}
