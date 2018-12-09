import { useRef, useEffect } from "react"

import StorageKeys from "../StorageKeys"
import useConst from "../useConst"

export default function useWeather() {
  const onDataLoad = useConst(new chrome.Event())

  const setStaleDataRef = useRef()
  const cacheLoaded = useConst(
    new Promise(resolve => {
      setStaleDataRef.current = newStaleData => {
        staleDataRef.current = newStaleData
        resolve()
      }
    })
  )

  const staleDataRef = useRef(null)

  const loadCalledRef = useRef(false)
  const onInitialLoadRef = useRef()
  const initialLoad = useConst(
    new Promise(resolve => {
      onInitialLoadRef.current = () => resolve()
    })
  )

  useEffect(() => {
    chrome.storage.local.get(
      StorageKeys.WEATHER_DATA,
      ({ [StorageKeys.WEATHER_DATA]: data }) =>
        setStaleDataRef.current(JSON.parse(data || null))
    )

    const onStorageChange = ({ [StorageKeys.WEATHER_DATA]: change }, area) => {
      if (area === "local" && change) {
        handleWeatherDataLoad(change.newValue)
      }
    }

    chrome.storage.onChanged.addListener(onStorageChange)

    return () => {
      chrome.storage.onChanged.removeListener(onStorageChange)
    }
  }, [])

  return useConst({
    onDataLoad,
    cacheLoaded,
    load,
    getSunInfoMS
  })

  function load() {
    if (!loadCalledRef.current) {
      loadCalledRef.current = true

      if (navigator.geolocation) {
        chrome.storage.local.get(
          StorageKeys.WEATHER_DATA,
          ({ [StorageKeys.WEATHER_DATA]: data }) => handleWeatherDataLoad(data)
        )
      } else {
        return Promise.reject(new Error("Geolocation is not supported."))
      }
    }

    return initialLoad
  }

  function getSunInfoMS(givenData) {
    return (givenData
      ? Promise.resolve(givenData)
      : cacheLoaded.then(() => staleDataRef.current)
    ).then(data => {
      const HOUR_MS = 60 * 60 * 1000
      const DAY_MS = 24 * HOUR_MS
      const DEFAULT_SUNSET = 18 * HOUR_MS // 6pm
      const DEFAULT_SUNRISE = 6 * HOUR_MS // 6am

      const tzOffset = new Date().getTimezoneOffset() * 60 * 1000
      const now = (Date.now() - tzOffset) % DAY_MS

      let sunrise
      let sunset
      if (data && Date.now() < data.sunExpiration) {
        sunrise = (data.sys.sunrise * 1000 - tzOffset) % DAY_MS
        sunset = (data.sys.sunset * 1000 - tzOffset) % DAY_MS
      } else {
        sunrise = DEFAULT_SUNRISE
        sunset = DEFAULT_SUNSET
      }

      return {
        now,
        sunrise,
        sunset,
        morningBegins: (sunrise - 2 * HOUR_MS) % DAY_MS,
        dayBegins: (sunrise + 2 * HOUR_MS) % DAY_MS,
        duskBegins: (sunset - 1 * HOUR_MS) % DAY_MS,
        nightBegins: (sunset + 1 * HOUR_MS) % DAY_MS,
        isDay: sunrise < now && now < sunset
      }
    })
  }

  function handleWeatherDataLoad(dataString) {
    const data = JSON.parse(dataString || null)
    setStaleDataRef.current(data)

    if (data && Date.now() < data.hardExpiration) {
      onInitialLoadRef.current()
      onDataLoad.dispatch(data)
    } else {
      onDataLoad.dispatch(null)
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
