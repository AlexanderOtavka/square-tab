import React, { useEffect, useRef } from "react"
import classnames from "classnames"

import createUpdater from "./createWeatherUpdater"
import unpackRefs from "./unpackRefs"

import weatherIconStyles from "../weather-icons/weather-icons.css"
import styles from "./Weather.css"

export default function Weather({ store }) {
  const $weatherWrapper = useRef() //document.querySelector(".wrapper")
  const $weatherIcon = useRef() // document.querySelector(".icon")
  const $temperature = useRef() //document.querySelector("#temperature")

  useEffect(
    () => {
      const updater = createUpdater(
        unpackRefs({ $weatherWrapper, $weatherIcon, $temperature }),
        store
      )

      return updater.unsubscribe
    },
    [store]
  )

  return (
    <a
      ref={$weatherWrapper}
      className={styles.wrapper}
      href="https://www.google.com/search?q=weather"
      hidden
    >
      <i
        ref={$weatherIcon}
        className={classnames(
          styles.icon,
          weatherIconStyles["wi"],
          weatherIconStyles["wi-day-sunny"]
        )}
      />
      <span ref={$temperature} />
    </a>
  )
}
