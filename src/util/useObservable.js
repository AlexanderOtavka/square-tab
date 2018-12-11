import { useState, useEffect, useMemo } from "react"
import { distinctUntilChanged } from "rxjs/operators"

export default function useObservable(observable, initialValue = undefined) {
  const [value, setValue] = useState(initialValue)

  const distinctObservable = useMemo(
    () => observable.pipe(distinctUntilChanged()),
    [observable]
  )

  useEffect(
    () => {
      const subscription = distinctObservable.subscribe({
        next: value => {
          setValue(() => value)
        },
        error: err => {
          throw err
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    },
    [distinctObservable]
  )

  return value
}
