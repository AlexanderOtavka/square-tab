import { useState, useEffect, useMemo } from "react"
import { distinctUntilChanged, drop } from "rxjs/operators"

export default function useBehaviorSubject(subject) {
  const [value, setValue] = useState(() => subject.getValue())

  const distinctObservable = useMemo(
    () =>
      subject.pipe(
        distinctUntilChanged(),
        drop(1)
      ),
    [subject]
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
