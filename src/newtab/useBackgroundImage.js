import { useEffect, useState, useRef } from "react"

import storageKeys from "../util/storageKeys"
import * as Settings from "../Settings"

function getImageUrl(search = "") {
  const screenPxWidth = window.screen.availWidth * window.devicePixelRatio
  const screenPxHeight = window.screen.availHeight * window.devicePixelRatio
  return (
    `https://source.unsplash.com/${screenPxWidth}x${screenPxHeight}/` +
    `?nature,${search}`
  )
}

export default function useBackgroundImage(readyToFetch, getSunInfoMs) {
  // Fetch and cache next image
  const imageWasFetched = useRef(false)
  useEffect(
    () => {
      if (readyToFetch && !!getSunInfoMs && !imageWasFetched.current) {
        imageWasFetched.current = true

        const {
          now,
          morningBegins,
          dayBegins,
          duskBegins,
          nightBegins
        } = getSunInfoMs(new Date())

        const url = Settings.get(Settings.keys.USE_TIME_OF_DAY_IMAGES)
          ? nightBegins < now || now <= morningBegins
            ? getImageUrl("night")
            : morningBegins < now && now <= dayBegins
            ? getImageUrl("morning")
            : duskBegins < now && now <= nightBegins
            ? getImageUrl("evening")
            : getImageUrl()
          : getImageUrl()

        chrome.runtime.getBackgroundPage(page => {
          page.fetchAndCacheImage(url)
        })
      }
    },
    [readyToFetch, getSunInfoMs]
  )

  const [dataUrl, setDataUrl] = useState("")
  const [sourceUrl, setSourceUrl] = useState("")
  const [cacheIsLoaded, setCacheIsLoaded] = useState(false)

  // Load cached image
  useEffect(() => {
    new Promise(resolve => {
      chrome.storage.local.get(
        [storageKeys.IMAGE_DATA_URL, storageKeys.IMAGE_SOURCE_URL],
        data => {
          resolve({
            dataUrl: data[storageKeys.IMAGE_DATA_URL],
            sourceUrl: data[storageKeys.IMAGE_SOURCE_URL]
          })
        }
      )
    }).then(({ dataUrl = getImageUrl(), sourceUrl = dataUrl }) => {
      setDataUrl(dataUrl)
      setSourceUrl(sourceUrl)
      setCacheIsLoaded(true)
    })
  }, [])

  return { dataUrl, sourceUrl, cacheIsLoaded }
}
