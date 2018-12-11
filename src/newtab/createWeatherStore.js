import { BehaviorSubject } from "rxjs"

import storageKeys from "../util/storageKeys"

export default function createWeatherStore() {
  const dataSubject = new BehaviorSubject(null)

  let setStaleData
  const cacheLoaded = new Promise(resolve => {
    setStaleData = resolve
  })

  let loadCalled = false
  let onInitialLoad
  const initialLoad = new Promise(resolve => {
    onInitialLoad = () => resolve()
  })

  chrome.storage.onChanged.addListener(
    ({ [storageKeys.WEATHER_DATA]: change }, area) => {
      if (area === "local" && change) {
        handleWeatherDataLoad(change.newValue)
      }
    }
  )

  chrome.storage.local.get(
    storageKeys.WEATHER_DATA,
    ({ [storageKeys.WEATHER_DATA]: data }) =>
      setStaleData(JSON.parse(data || null))
  )

  return {
    dataSubject,
    cacheLoaded,
    load
  }

  function load() {
    if (!loadCalled) {
      loadCalled = true

      if (navigator.geolocation) {
        chrome.storage.local.get(
          storageKeys.WEATHER_DATA,
          ({ [storageKeys.WEATHER_DATA]: data }) => handleWeatherDataLoad(data)
        )
      } else {
        return Promise.reject(new Error("Geolocation is not supported."))
      }
    }

    return initialLoad
  }

  function handleWeatherDataLoad(dataString) {
    const data = JSON.parse(dataString || null)
    setStaleData(data)

    if (data && Date.now() < data.hardExpiration) {
      onInitialLoad()
      dataSubject.next(data)
    } else {
      dataSubject.next(null)
    }

    if (!data || data.freshExpiration < Date.now()) {
      fetchAndCacheWeatherData()
    }
  }

  function fetchAndCacheWeatherData() {
    chrome.runtime.getBackgroundPage(page => {
      page.fetchAndCacheWeatherData()
    })
  }
}
