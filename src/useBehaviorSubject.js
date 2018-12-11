import useObservable from "./useObservable"

export default function useBehaviorSubject(subject) {
  return useObservable(subject, () => subject.getValue())
}
