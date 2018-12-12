import { useEffect, useState } from "react"

import storageKeys from "../util/storageKeys"
import * as Settings from "../Settings"
import getSunInfoMs from "./getSunInfoMs"

function getImageUrl(search = "") {
  const screenPxWidth = window.screen.availWidth * window.devicePixelRatio
  const screenPxHeight = window.screen.availHeight * window.devicePixelRatio
  return (
    `https://source.unsplash.com/${screenPxWidth}x${screenPxHeight}/` +
    `?nature,${search}`
  )
}

export default function useBackgroundImage({
  now,
  morningBegins,
  dayBegins,
  duskBegins,
  nightBegins
}) {
  // Fetch and cache next image
  useEffect(() => {
    Settings.loaded
      .then(() => {
        if (Settings.get(Settings.keys.USE_TIME_OF_DAY_IMAGES)) {
          if (nightBegins < now || now <= morningBegins) {
            return getImageUrl("night")
          } else if (morningBegins < now && now <= dayBegins) {
            return getImageUrl("morning")
          } else if (duskBegins < now && now <= nightBegins) {
            return getImageUrl("evening")
          } else {
            return getImageUrl()
          }
        } else {
          return getImageUrl()
        }
      })
      .then(imageResourceURI => {
        chrome.runtime.getBackgroundPage(page => {
          page.fetchAndCacheImage(imageResourceURI)
        })
      })
  }, [])

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
