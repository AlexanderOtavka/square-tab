import StorageKeys from "../StorageKeys"
import * as Surprise from "../Surprise"
import * as Settings from "../Settings"

import styles from "./Page.css"

export default function createPage(
  {
    $root,
    $body,
    $backgroundImage,
    $surpriseLink,
    $unsplashLink,
    $rawSourceLink,
    $time,
    $greeting,
    $weatherWrapper,
    $drawerBackdrop,
    $bookmarksOpenButton,
    $bookmarksCloseButton,
    $bookmarksDrawerHeader,
    $bookmarksUpButton,
    $bookmarksDrawerItems
  },
  bookmarksNavigator,
  bookmarksEditor,
  weather
) {
  const backgroundImageReady = Settings.loaded
    .then(() => {
      if (Settings.get(Settings.keys.SURPRISE)) {
        return { dataUrl: Surprise.currentImageData.url }
      } else {
        return loadImage()
      }
    })
    .then(({ dataUrl, sourceUrl }) => updateImage(dataUrl, sourceUrl))

  fetchAndCacheImage()

  Promise.all([
    Settings.loaded,
    weather.cacheLoaded,
    backgroundImageReady
  ]).then(() => resolveBody())

  updateTime()
  setInterval(() => updateTime(), 1000)

  disableDefaultRightClick()
  addSettingsChangeListeners()
  addWeatherChangeListeners()
  addGlobalDragDropListeners()
  addBookmarksDragDropListeners()
  addBookmarksClickListeners()
  addBookmarksDrawerListeners()
  addBookmarksTooltipListeners()

  if (Surprise.isTime()) {
    $surpriseLink.hidden = false
  }

  const initialSurprise = false

  $surpriseLink.addEventListener("click", () => {
    Settings.loaded.then(() => {
      const isSurprise = !Settings.get(Settings.keys.SURPRISE)
      Settings.set(Settings.keys.SURPRISE, isSurprise)

      if (isSurprise) {
        updateImage(Surprise.initialImageData.url)
        initialSurprise = true
      } else {
        updateImage("")
        updateImage()
        initialSurprise = false
      }
    })
  })

  Settings.onChanged(Settings.keys.SURPRISE).subscribe(surprise => {
    if (surprise) {
      $surpriseLink.textContent = "Let her go, Anakin"
      $unsplashLink.hidden = true
    } else {
      $surpriseLink.textContent = "A surprise, to be sure..."
      $unsplashLink.hidden = false
    }
  })

  function getImageUrl(search = "") {
    const screenPxWidth = window.screen.availWidth * window.devicePixelRatio
    const screenPxHeight = window.screen.availHeight * window.devicePixelRatio
    return (
      `https://source.unsplash.com/${screenPxWidth}x${screenPxHeight}/` +
      `?nature,${search}`
    )
  }

  function loadImage() {
    return new Promise(resolve => {
      chrome.storage.local.get(
        [StorageKeys.IMAGE_DATA_URL, StorageKeys.IMAGE_SOURCE_URL],
        data => {
          resolve({
            dataUrl: data[StorageKeys.IMAGE_DATA_URL],
            sourceUrl: data[StorageKeys.IMAGE_SOURCE_URL]
          })
        }
      )
    })
  }

  function updateImage(dataUrl = getImageUrl(), sourceUrl = dataUrl) {
    $backgroundImage.src = dataUrl
    $rawSourceLink.href = sourceUrl
  }

  function fetchAndCacheImage() {
    Settings.loaded
      .then(() => {
        if (Settings.get(Settings.keys.USE_TIME_OF_DAY_IMAGES)) {
          return weather
            .getSunInfoMS()
            .then(
              ({ now, morningBegins, dayBegins, duskBegins, nightBegins }) => {
                if (nightBegins < now || now <= morningBegins) {
                  return getImageUrl("night")
                } else if (morningBegins < now && now <= dayBegins) {
                  return getImageUrl("morning")
                } else if (duskBegins < now && now <= nightBegins) {
                  return getImageUrl("evening")
                } else {
                  return getImageUrl()
                }
              }
            )
        } else {
          return getImageUrl()
        }
      })
      .then(imageResourceURI => {
        chrome.runtime.getBackgroundPage(page => {
          page.fetchAndCacheImage(imageResourceURI)
        })
      })
  }

  function resolveBody() {
    $body.removeAttribute("unresolved")
    $body.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: 200,
      easing: "cubic-bezier(0.215, 0.61, 0.355, 1)"
    })
  }

  function updateTime() {
    const date = new Date()
    const hours = date.getHours()
    const minutes = date.getMinutes()

    let minutesStr = String(minutes)
    if (minutesStr.length === 1) {
      minutesStr = `0${minutesStr}`
    }

    Settings.loaded.then(() => {
      const hoursStr = String(
        Settings.get(Settings.keys.TWENTY_FOUR_HOUR_TIME)
          ? hours
          : hours % 12 || 12
      )
      $time.textContent = `${hoursStr}:${minutesStr}`

      if (initialSurprise) {
        $greeting.textContent = Surprise.initialImageData.greeting
      } else if (Settings.get(Settings.keys.SURPRISE)) {
        $greeting.textContent = Surprise.currentImageData.greeting
      } else {
        weather.getSunInfoMS().then(({ now, duskBegins, morningBegins }) => {
          const MIDNIGHT = 0
          const NOON = 12 * 60 * 60 * 1000

          if (MIDNIGHT < now && now <= morningBegins) {
            $greeting.textContent = "Hello, Night Owl"
          } else if (morningBegins < now && now <= NOON) {
            $greeting.textContent = "Good Morning"
          } else if (NOON < now && now <= duskBegins) {
            $greeting.textContent = "Good Afternoon"
          } else {
            $greeting.textContent = "Good Evening"
          }
        })
      }
    })
  }

  function disableDefaultRightClick() {
    $root.addEventListener("contextmenu", ev => ev.preventDefault(), true)
  }

  function addSettingsChangeListeners() {
    Settings.onChanged(Settings.keys.BOOKMARKS_DRAWER_MODE).subscribe(value =>
      updateBookmarkDrawerMode(value)
    )

    Settings.onChanged(Settings.keys.BOOKMARKS_DRAWER_POSITION).subscribe(
      value => updateBookmarkDrawerPosition(value)
    )

    Settings.onChanged(Settings.keys.BOOKMARKS_DRAWER_SMALL).subscribe(
      value => {
        updateBookmarkDrawerSmall(value)
        bookmarksNavigator.updateSize(value)
      }
    )

    Settings.onChanged(Settings.keys.SHOW_PHOTO_SOURCE).subscribe(value =>
      updateShowPhotoSource(value)
    )

    Settings.onChanged(Settings.keys.BOXED_INFO).subscribe(value =>
      updateBoxedInfo(value)
    )

    Settings.onChanged(Settings.keys.SHOW_WEATHER).subscribe(value =>
      updateWeather(value)
    )

    Settings.onChanged(Settings.keys.TEMPERATURE_UNIT).subscribe(value =>
      weather.updateTempWithUnit(value)
    )
  }

  function updateBookmarkDrawerMode(mode) {
    const TOGGLE = styles.bookmarksDrawerModeToggle
    const HOVER = styles.bookmarksDrawerModeHover
    const ALWAYS = styles.bookmarksDrawerModeAlways
    const NEVER = styles.bookmarksDrawerModeNever
    closeBookmarks()
    $root.classList.remove(TOGGLE, HOVER, ALWAYS, NEVER)
    switch (mode) {
      case Settings.enums.BookmarkDrawerModes.TOGGLE:
        $root.classList.add(TOGGLE)
        break
      case Settings.enums.BookmarkDrawerModes.ALWAYS:
        $root.classList.add(ALWAYS)
        break
      case Settings.enums.BookmarkDrawerModes.HOVER:
        $root.classList.add(HOVER)
        break
      case Settings.enums.BookmarkDrawerModes.NEVER:
        $root.classList.add(NEVER)
        break
      default:
        console.error("Invalid bookmark drawer mode.")
    }
  }

  function updateBookmarkDrawerPosition(position) {
    const RIGHT = styles.bookmarksDrawerPositionRight
    const LEFT = styles.bookmarksDrawerPositionLeft
    $root.classList.remove(RIGHT, LEFT)
    switch (position) {
      case Settings.enums.BookmarkDrawerPositions.RIGHT:
        $root.classList.add(RIGHT)
        break
      case Settings.enums.BookmarkDrawerPositions.LEFT:
        $root.classList.add(LEFT)
        break
      default:
        console.error("Invalid bookmark drawer position")
    }
  }

  function updateBookmarkDrawerSmall(drawerSmall) {
    $root.classList.toggle(styles.bookmarksDrawerSmall, drawerSmall)
  }

  function updateShowPhotoSource(show) {
    $root.classList.toggle(styles.showPhotoSource, show)
  }

  function updateBoxedInfo(boxedInfo) {
    $root.classList.toggle(styles.boxedInfo, boxedInfo)
  }

  function addWeatherChangeListeners() {
    weather.onDataLoad.addListener(data => {
      const showWeather = data && Settings.get(Settings.keys.SHOW_WEATHER)
      updateWeather(showWeather)
    })
  }

  function updateWeather(showWeather) {
    if (showWeather) {
      return weather.load().then(() => {
        $weatherWrapper.hidden = false
      })
    } else {
      $weatherWrapper.hidden = true
      return Promise.resolve()
    }
  }

  function addGlobalDragDropListeners() {
    let removeClassTimeout

    window.addEventListener("dragover", () => {
      $root.classList.add(styles.dragover)

      clearTimeout(removeClassTimeout)
      removeClassTimeout = setTimeout(() => {
        $root.classList.remove(styles.dragover)
      }, 100)
    })
  }

  function addBookmarksDragDropListeners() {
    $bookmarksDrawerItems.addEventListener(
      "x-bookmark-drag-start",
      ev => bookmarksEditor.onBookmarkDragStart(ev),
      true
    )
    $bookmarksDrawerItems.addEventListener(
      "x-bookmark-drag-over",
      ev => bookmarksEditor.onBookmarkDragOver(ev),
      true
    )
    $bookmarksDrawerItems.addEventListener(
      "x-bookmark-drop",
      ev => bookmarksEditor.onBookmarkDrop(ev),
      true
    )

    $bookmarksDrawerItems.addEventListener("dragover", ev =>
      bookmarksEditor.onItemsDragOver(ev)
    )
    $bookmarksDrawerItems.addEventListener("drop", ev =>
      bookmarksEditor.onItemsDrop(ev)
    )

    $bookmarksUpButton.addEventListener("dragover", ev =>
      bookmarksEditor.onUpButtonDragOver(ev)
    )
    $bookmarksUpButton.addEventListener("dragleave", ev =>
      bookmarksEditor.onUpButtonDragLeave(ev)
    )
    $bookmarksUpButton.addEventListener("drop", ev =>
      bookmarksEditor.onUpButtonDrop(ev)
    )

    $bookmarksDrawerItems.addEventListener(
      "dragleave",
      ev => bookmarksEditor.onDragLeave(ev),
      true
    )
    $bookmarksDrawerItems.addEventListener(
      "dragend",
      ev => bookmarksEditor.onDragEnd(ev),
      true
    )
  }

  function addBookmarksClickListeners() {
    $bookmarksUpButton.addEventListener("click", () => {
      bookmarksNavigator.ascend()
    })

    $bookmarksDrawerItems.addEventListener(
      "x-bookmark-click",
      ev => {
        bookmarksNavigator.openBookmark(ev.detail.nodeId)
      },
      true
    )

    $bookmarksDrawerHeader.addEventListener("contextmenu", ev => {
      let nodeId
      if (ev.target === $bookmarksUpButton) {
        nodeId = bookmarksNavigator.getParentFolder()
      } else {
        nodeId = bookmarksNavigator.getCurrentFolder()
      }

      bookmarksEditor.openCtxMenu(ev.x, ev.y, nodeId)
    })

    $bookmarksDrawerItems.addEventListener("contextmenu", ev => {
      if (ev.target !== $bookmarksDrawerItems) {
        return
      }
      bookmarksEditor.openCtxMenu(ev.x, ev.y, null)
    })

    $bookmarksDrawerItems.addEventListener(
      "x-bookmark-ctx-menu",
      ev => {
        bookmarksEditor.openCtxMenu(ev.detail.x, ev.detail.y, ev.target.node.id)
      },
      true
    )
  }

  function addBookmarksDrawerListeners() {
    $bookmarksOpenButton.addEventListener("click", () => openBookmarks())
    $bookmarksCloseButton.addEventListener("click", () => closeBookmarks())
    $drawerBackdrop.addEventListener("click", () => closeBookmarks())
  }

  function openBookmarks() {
    $root.classList.add(styles.bookmarksDrawerOpen)
  }

  function closeBookmarks() {
    $root.classList.remove(styles.bookmarksDrawerOpen)
  }

  function addBookmarksTooltipListeners() {
    $bookmarksDrawerItems.addEventListener(
      "x-bookmark-mouseover",
      ev => bookmarksNavigator.onBookmarkMouseOver(ev),
      true
    )
    $bookmarksDrawerItems.addEventListener(
      "x-bookmark-mouseleave",
      () => bookmarksNavigator.hideTooltip(),
      true
    )

    $bookmarksDrawerHeader.addEventListener("mouseover", () =>
      bookmarksNavigator.onHeaderMouseOver()
    )
    $bookmarksDrawerHeader.addEventListener("mouseleave", () =>
      bookmarksNavigator.hideTooltip()
    )
  }
}