import StorageKeys from "../StorageKeys"

export default function createWeatherStore() {
  const onDataLoad = new chrome.Event()

  let setStaleData
  const cacheLoaded = new Promise(resolve => {
    setStaleData = newStaleData => {
      staleData = newStaleData
      resolve()
    }
  })

  let staleData = null

  let loadCalled = false
  let onInitialLoad
  const initialLoad = new Promise(resolve => {
    onInitialLoad = () => resolve()
  })

  chrome.storage.onChanged.addListener(
    ({ [StorageKeys.WEATHER_DATA]: change }, area) => {
      if (area === "local" && change) {
        handleWeatherDataLoad(change.newValue)
      }
    }
  )

  chrome.storage.local.get(
    StorageKeys.WEATHER_DATA,
    ({ [StorageKeys.WEATHER_DATA]: data }) =>
      setStaleData(JSON.parse(data || null))
  )

  return {
    onDataLoad,
    cacheLoaded,
    load,
    getSunInfoMS
  }

  function load() {
    if (!loadCalled) {
      loadCalled = true

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
      : cacheLoaded.then(() => staleData)
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
    setStaleData(data)

    if (data && Date.now() < data.hardExpiration) {
      onInitialLoad()
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
