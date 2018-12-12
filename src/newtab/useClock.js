import { useEffect, useState, useCallback } from "react"
import { useSetting, keys as settingKeys } from "../Settings"

export default function useClock(getSunInfoMs) {
  const timeIs24Hour = useSetting(settingKeys.TWENTY_FOUR_HOUR_TIME)

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
