import { useEffect, useState, useCallback } from "react"

import useBehaviorSubject from "../util/useBehaviorSubject"

const HOUR_MS = 60 * 60 * 1000
const DAY_MS = 24 * HOUR_MS
const DEFAULT_SUNRISE = 6 * HOUR_MS // 6am
const DEFAULT_SUNSET = 18 * HOUR_MS // 6pm

function getSunInfoMs(data, date) {
  const tzOffset = date.getTimezoneOffset() * 60 * 1000
  const now = (date.valueOf() - tzOffset) % DAY_MS

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
}

export default function useWeather(weatherStore) {
  const data = useBehaviorSubject(weatherStore.dataSubject)
  const getSunInfo = useCallback(date => getSunInfoMs(data, date), [data])
  const [cacheIsLoaded, setCacheLoaded] = useState(false)
  useEffect(() => {
    weatherStore.cacheLoaded.then(() => setCacheLoaded(true))
  }, [])

  return {
    data,
    getSunInfo,
    cacheIsLoaded
  }
}
