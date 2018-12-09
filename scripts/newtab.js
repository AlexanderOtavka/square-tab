import StorageKeys from "../modules/StorageKeys.js"
import * as Surprise from "../modules/Surprise.js"
import * as Settings from "../modules/Settings.js"
import * as Weather from "../modules/Weather.js"
import * as BookmarksNavigator from "../modules/BookmarksNavigator.js"
import * as BookmarksEditor from "../modules/BookmarksEditor.js"

const $root = document.documentElement
const $body = document.body
const $backgroundImage = document.querySelector("#background-image")
const $surpriseLink = document.querySelector("#surprise-link")
const $unsplashLink = document.querySelector("#unsplash-link")
const $sourceLink = document.querySelector("#source-link")
const $time = document.querySelector("#time")
const $greeting = document.querySelector("#greeting")
const $weatherWrapper = document.querySelector("#weather-wrapper")
const $drawerBackdrop = document.querySelector("#drawer-backdrop")
const $bookmarksOpenButton = document.querySelector("#bookmarks-open-button")
const $bookmarksCloseButton = document.querySelector("#bookmarks-close-button")
const $bookmarksDrawerHeader = document.querySelector(
  "#bookmarks-drawer .drawer-header"
)
const $bookmarksUpButton = document.querySelector("#bookmarks-up-button")
const $bookmarksDrawerItems = document.querySelector("#bookmarks-drawer-items")

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

Promise.all([Settings.loaded, Weather.cacheLoaded, backgroundImageReady]).then(
  () => resolveBody()
)

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
  $sourceLink.href = sourceUrl
}

function fetchAndCacheImage() {
  Settings.loaded
    .then(() => {
      if (Settings.get(Settings.keys.USE_TIME_OF_DAY_IMAGES)) {
        return Weather.getSunInfoMS().then(
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
      Weather.getSunInfoMS().then(({ now, duskBegins, morningBegins }) => {
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

  Settings.onChanged(Settings.keys.BOOKMARKS_DRAWER_POSITION).subscribe(value =>
    updateBookmarkDrawerPosition(value)
  )

  Settings.onChanged(Settings.keys.BOOKMARKS_DRAWER_SMALL).subscribe(value => {
    updateBookmarkDrawerSmall(value)
    BookmarksNavigator.updateSize(value)
  })

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
    Weather.updateTempWithUnit(value)
  )
}

function updateBookmarkDrawerMode(mode) {
  const TOGGLE = "bookmarks-drawer-mode-toggle"
  const HOVER = "bookmarks-drawer-mode-hover"
  const ALWAYS = "bookmarks-drawer-mode-always"
  const NEVER = "bookmarks-drawer-mode-never"
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
  const RIGHT = "bookmarks-drawer-position-right"
  const LEFT = "bookmarks-drawer-position-left"
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
  $root.classList.toggle("bookmarks-drawer-small", drawerSmall)
}

function updateShowPhotoSource(show) {
  $root.classList.toggle("show-photo-source", show)
}

function updateBoxedInfo(boxedInfo) {
  $root.classList.toggle("boxed-info", boxedInfo)
}

function addWeatherChangeListeners() {
  Weather.onDataLoad.addListener(data => {
    const showWeather = data && Settings.get(Settings.keys.SHOW_WEATHER)
    updateWeather(showWeather)
  })
}

function updateWeather(showWeather) {
  if (showWeather) {
    return Weather.load().then(() => {
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
    $root.classList.add("dragover")

    clearTimeout(removeClassTimeout)
    removeClassTimeout = setTimeout(() => {
      $root.classList.remove("dragover")
    }, 100)
  })
}

function addBookmarksDragDropListeners() {
  $bookmarksDrawerItems.addEventListener(
    "x-bookmark-drag-start",
    ev => BookmarksEditor.onBookmarkDragStart(ev),
    true
  )
  $bookmarksDrawerItems.addEventListener(
    "x-bookmark-drag-over",
    ev => BookmarksEditor.onBookmarkDragOver(ev),
    true
  )
  $bookmarksDrawerItems.addEventListener(
    "x-bookmark-drop",
    ev => BookmarksEditor.onBookmarkDrop(ev),
    true
  )

  $bookmarksDrawerItems.addEventListener("dragover", ev =>
    BookmarksEditor.onItemsDragOver(ev)
  )
  $bookmarksDrawerItems.addEventListener("drop", ev =>
    BookmarksEditor.onItemsDrop(ev)
  )

  $bookmarksUpButton.addEventListener("dragover", ev =>
    BookmarksEditor.onUpButtonDragOver(ev)
  )
  $bookmarksUpButton.addEventListener("dragleave", ev =>
    BookmarksEditor.onUpButtonDragLeave(ev)
  )
  $bookmarksUpButton.addEventListener("drop", ev =>
    BookmarksEditor.onUpButtonDrop(ev)
  )

  $bookmarksDrawerItems.addEventListener(
    "dragleave",
    ev => BookmarksEditor.onDragLeave(ev),
    true
  )
  $bookmarksDrawerItems.addEventListener(
    "dragend",
    ev => BookmarksEditor.onDragEnd(ev),
    true
  )
}

function addBookmarksClickListeners() {
  $bookmarksUpButton.addEventListener("click", () => {
    BookmarksNavigator.ascend()
  })

  $bookmarksDrawerItems.addEventListener(
    "x-bookmark-click",
    ev => {
      BookmarksNavigator.openBookmark(ev.detail.nodeId)
    },
    true
  )

  $bookmarksDrawerHeader.addEventListener("contextmenu", ev => {
    let nodeId
    if (ev.target === $bookmarksUpButton) {
      nodeId = BookmarksNavigator.getParentFolder()
    } else {
      nodeId = BookmarksNavigator.getCurrentFolder()
    }

    BookmarksEditor.openCtxMenu(ev.x, ev.y, nodeId)
  })

  $bookmarksDrawerItems.addEventListener("contextmenu", ev => {
    if (ev.target !== $bookmarksDrawerItems) {
      return
    }
    BookmarksEditor.openCtxMenu(ev.x, ev.y, null)
  })

  $bookmarksDrawerItems.addEventListener(
    "x-bookmark-ctx-menu",
    ev => {
      BookmarksEditor.openCtxMenu(ev.detail.x, ev.detail.y, ev.target.node.id)
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
  $root.classList.add("bookmarks-drawer-open")
}

function closeBookmarks() {
  $root.classList.remove("bookmarks-drawer-open")
}

function addBookmarksTooltipListeners() {
  $bookmarksDrawerItems.addEventListener(
    "x-bookmark-mouseover",
    ev => BookmarksNavigator.onBookmarkMouseOver(ev),
    true
  )
  $bookmarksDrawerItems.addEventListener(
    "x-bookmark-mouseleave",
    () => BookmarksNavigator.hideTooltip(),
    true
  )

  $bookmarksDrawerHeader.addEventListener("mouseover", () =>
    BookmarksNavigator.onHeaderMouseOver()
  )
  $bookmarksDrawerHeader.addEventListener("mouseleave", () =>
    BookmarksNavigator.hideTooltip()
  )
}
