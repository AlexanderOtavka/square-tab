import { useMemo } from "react"
import { Observable } from "rxjs"

import useObservable from "./useObservable"

export default function usePromise(promise, initialValue = undefined) {
  const observable = useMemo(() => Observable.fromPromise(promise), [promise])
  return useObservable(observable, initialValue)
}
