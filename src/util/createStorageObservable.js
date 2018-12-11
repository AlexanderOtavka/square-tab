import { Observable } from "rxjs"

export default function createStorageObservable(area, key) {
  return new Observable(observer => {
    const nextJson = json => observer.next(JSON.parse(json || null))
    const handleError = () => {
      if (chrome.runtime.lastError) {
        observer.error(chrome.runtime.lastError)
      }
    }

    chrome.storage[area].get(key, ({ [key]: jsonData }) => {
      handleError()
      nextJson(jsonData)
    })

    const listener = ({ [key]: change }, changedArea) => {
      handleError()
      if (changedArea === area && change) {
        nextJson(change.newValue)
      }
    }

    chrome.storage.onChanged.addListener(listener)

    return () => {
      chrome.storage.onChanged.removeListener(listener)
    }
  })
}
