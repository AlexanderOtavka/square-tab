import { useEffect, useState, useCallback } from "react"
import * as Settings from "../Settings"

export default function useClock(settingsAreLoaded, getSunInfoMs) {
  const [timeIs24Hour, setTime24Hour] = useState(
    Settings.get(Settings.keys.TWENTY_FOUR_HOUR_TIME)
  )
  useEffect(
    () => {
      setTime24Hour(Settings.get(Settings.keys.TWENTY_FOUR_HOUR_TIME))
    },
    [settingsAreLoaded]
  )

  const [timeString, setTimeString] = useState("")
  const [greeting, setGreeting] = useState("")

  const updateTime = useCallback(
    () => {
      const date = new Date()
      const hours = date.getHours()
      const minutes = date.getMinutes()

      let minutesStr = String(minutes)
      if (minutesStr.length === 1) {
        minutesStr = `0${minutesStr}`
      }

      const hoursStr = String(timeIs24Hour ? hours : hours % 12 || 12)
      setTimeString(`${hoursStr}:${minutesStr}`)

      const { now, duskBegins, morningBegins } = getSunInfoMs(date)
      const MIDNIGHT = 0
      const NOON = 12 * 60 * 60 * 1000

      setGreeting(
        MIDNIGHT < now && now <= morningBegins
          ? "Hello, Night Owl"
          : morningBegins < now && now <= NOON
          ? "Good Morning"
          : NOON < now && now <= duskBegins
          ? "Good Afternoon"
          : "Good Evening"
      )
    },
    [timeIs24Hour, getSunInfoMs]
  )

  useEffect(
    () => {
      updateTime()
      const interval = setInterval(updateTime, 1000)
      return () => clearInterval(interval)
    },
    [updateTime]
  )

  return { timeString, greeting }
}
