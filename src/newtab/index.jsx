import React from "react"
import { render } from "react-dom"

import StorageKeys from "../StorageKeys"
import * as Surprise from "../Surprise"
import * as Settings from "../Settings"
import createWeather from "./createWeather"
import createBookmarksNavigator from "./createBookmarksNavigator"
import createBookmarksEditor from "./createBookmarksEditor"

import "./x-bookmark"
import "./x-context-menu"
import "./x-dialog"
import "./x-icon"
import "./x-tooltip"

import "../../public/styles/shared-styles.css"
import "./index.css"
import "./weather-icons/weather-icons.css"

render(
  <>
    <img id="background-image" className="fullbleed" />

    <header id="main-toolbar" className="toolbar">
      <a id="surprise-link" hidden />
      <a
        id="unsplash-link"
        className="source-link"
        target="_blank"
        href="https://unsplash.com/"
      >
        Unsplash
      </a>
      <a id="source-link" className="source-link" target="_blank">
        Photo
      </a>

      <span className="title" />

      <x-icon
        id="bookmarks-open-button"
        className="radial-shadow"
        icon="bookmarks"
        large
        button
      />
    </header>

    <main id="info-wrapper" className="fullbleed">
      <div id="info-box">
        <a id="time" href="https://www.google.com/search?q=time" />
        <div id="greeting" />

        <a
          id="weather-wrapper"
          href="https://www.google.com/search?q=weather"
          hidden
        >
          <i id="weather-icon" className="wi wi-day-sunny" />
          <span id="temperature" />
        </a>
      </div>
    </main>

    <div id="drawer-backdrop" className="fullbleed backdrop" />

    <aside id="bookmarks-drawer" className="drawer">
      <header className="drawer-header toolbar">
        <x-icon id="bookmarks-up-button" large />
        <span id="bookmarks-drawer-title" className="title" />
        <x-icon id="bookmarks-close-button" icon="close" large button />
      </header>

      <nav id="bookmarks-drawer-items" className="drawer-content" />
    </aside>

    <x-dialog id="bookmarks-edit-dialog">
      <img slot="title" id="bookmarks-edit-dialog-favicon" />
      <h1 slot="title" id="bookmarks-edit-dialog-title" />

      <div slot="content" className="row">
        <input id="bookmarks-edit-dialog-name" type="text" placeholder="Name" />
        <input id="bookmarks-edit-dialog-url" type="url" placeholder="URL" />
      </div>

      <button slot="cancel">Cancel</button>
      <button slot="confirm" id="bookmarks-edit-dialog-done">
        Done
      </button>
    </x-dialog>

    <x-tooltip id="bookmarks-drawer-tooltip" />

    <x-context-menu id="bookmarks-ctx-menu">
      <div
        id="bookmarks-ctx-menu-name"
        className="menu-item disabled line-below"
      />

      <div id="bookmarks-ctx-menu-edit" className="menu-item">
        Edit
      </div>
      <div id="bookmarks-ctx-menu-delete" className="menu-item">
        Delete
      </div>
      <hr />
      <div id="bookmarks-ctx-menu-add-page" className="menu-item">
        Add Page
      </div>
      <div id="bookmarks-ctx-menu-add-folder" className="menu-item">
        Add Folder
      </div>
    </x-context-menu>
  </>,
  document.getElementById("react-root")
)

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

const $drawer = document.querySelector("#bookmarks-drawer")
const $upButton = document.querySelector("#bookmarks-up-button")
const $drawerItems = document.querySelector("#bookmarks-drawer-items")
const $ctxMenu = document.querySelector("#bookmarks-ctx-menu")
const $ctxMenuName = document.querySelector("#bookmarks-ctx-menu-name")
const $ctxMenuEdit = document.querySelector("#bookmarks-ctx-menu-edit")
const $ctxMenuDelete = document.querySelector("#bookmarks-ctx-menu-delete")
const $ctxMenuAddPage = document.querySelector("#bookmarks-ctx-menu-add-page")
const $ctxMenuAddFolder = document.querySelector(
  "#bookmarks-ctx-menu-add-folder"
)
const $editDialog = document.querySelector("#bookmarks-edit-dialog")
const $editDialogFavicon = document.querySelector(
  "#bookmarks-edit-dialog-favicon"
)
const $editDialogTitle = document.querySelector("#bookmarks-edit-dialog-title")
const $editDialogName = document.querySelector("#bookmarks-edit-dialog-name")
const $editDialogURL = document.querySelector("#bookmarks-edit-dialog-url")
const $editDialogDone = document.querySelector("#bookmarks-edit-dialog-done")

const $header = document.querySelector("#bookmarks-drawer .drawer-header")
const $title = document.querySelector("#bookmarks-drawer .title")
const $drawerTooltip = document.querySelector("#bookmarks-drawer-tooltip")

const $weatherIcon = document.querySelector("#weather-icon")
const $temperature = document.querySelector("#temperature")

const bookmarksNavigator = createBookmarksNavigator({
  $header,
  $upButton,
  $title,
  $drawerItems,
  $drawerTooltip
})

const bookmarksEditor = createBookmarksEditor(
  {
    $drawer,
    $upButton,
    $drawerItems,
    $ctxMenu,
    $ctxMenuName,
    $ctxMenuEdit,
    $ctxMenuDelete,
    $ctxMenuAddPage,
    $ctxMenuAddFolder,
    $editDialog,
    $editDialogFavicon,
    $editDialogTitle,
    $editDialogName,
    $editDialogURL,
    $editDialogDone
  },
  bookmarksNavigator
)

const weather = createWeather({ $weatherIcon, $temperature })

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

Promise.all([Settings.loaded, weather.cacheLoaded, backgroundImageReady]).then(
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

  Settings.onChanged(Settings.keys.BOOKMARKS_DRAWER_POSITION).subscribe(value =>
    updateBookmarkDrawerPosition(value)
  )

  Settings.onChanged(Settings.keys.BOOKMARKS_DRAWER_SMALL).subscribe(value => {
    updateBookmarkDrawerSmall(value)
    bookmarksNavigator.updateSize(value)
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
    weather.updateTempWithUnit(value)
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
  $root.classList.add("bookmarks-drawer-open")
}

function closeBookmarks() {
  $root.classList.remove("bookmarks-drawer-open")
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
