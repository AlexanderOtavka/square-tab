import * as Surprise from "../Surprise"
import * as Settings from "../Settings"
import getSunInfoMs from "./getSunInfoMs"

import styles from "./Page.css"

export default function createPage(
  { $root, $time, $greeting, $bookmarksOpenButton },
  weatherStore,
  bookmarksDrawerModeSubject,
  bookmarksDrawerPositionSubject,
  bookmarksDrawerIsSmallSubject,
  bookmarksDrawerCloseSubject
) {
  updateTime()
  setInterval(() => updateTime(), 1000)

  disableDefaultRightClick()
  addSettingsChangeListeners()
  addGlobalDragDropListeners()
  addBookmarksDrawerListeners()

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

      weatherStore.cacheLoaded
        .then(getSunInfoMs)
        .then(({ now, duskBegins, morningBegins }) => {
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
      updateBookmarkDrawerSmall
    )

    Settings.onChanged(Settings.keys.SHOW_PHOTO_SOURCE).subscribe(value =>
      updateShowPhotoSource(value)
    )

    Settings.onChanged(Settings.keys.BOXED_INFO).subscribe(value =>
      updateBoxedInfo(value)
    )
  }

  function updateBookmarkDrawerMode(mode) {
    const TOGGLE = styles.bookmarksDrawerModeToggle
    const HOVER = styles.bookmarksDrawerModeHover
    const ALWAYS = styles.bookmarksDrawerModeAlways
    const NEVER = styles.bookmarksDrawerModeNever
    $root.classList.remove(
      TOGGLE,
      HOVER,
      ALWAYS,
      NEVER,
      styles.bookmarksDrawerOpen
    )
    switch (mode) {
      case Settings.enums.BookmarkDrawerModes.TOGGLE:
        $root.classList.add(TOGGLE)
        bookmarksDrawerModeSubject.next("toggleClosed")
        break
      case Settings.enums.BookmarkDrawerModes.ALWAYS:
        $root.classList.add(ALWAYS)
        bookmarksDrawerModeSubject.next("always")
        break
      case Settings.enums.BookmarkDrawerModes.HOVER:
        $root.classList.add(HOVER)
        bookmarksDrawerModeSubject.next("hover")
        break
      case Settings.enums.BookmarkDrawerModes.NEVER:
        $root.classList.add(NEVER)
        bookmarksDrawerModeSubject.next("never")
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
        bookmarksDrawerPositionSubject.next("right")
        break
      case Settings.enums.BookmarkDrawerPositions.LEFT:
        $root.classList.add(LEFT)
        bookmarksDrawerPositionSubject.next("left")
        break
      default:
        console.error("Invalid bookmark drawer position")
    }
  }

  function updateBookmarkDrawerSmall(drawerSmall) {
    $root.classList.toggle(styles.bookmarksDrawerSmall, drawerSmall)
    bookmarksDrawerIsSmallSubject.next(drawerSmall)
  }

  function updateShowPhotoSource(show) {
    $root.classList.toggle(styles.showPhotoSource, show)
  }

  function updateBoxedInfo(boxedInfo) {
    $root.classList.toggle(styles.boxedInfo, boxedInfo)
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

  function addBookmarksDrawerListeners() {
    $bookmarksOpenButton.addEventListener("click", openBookmarks)
    bookmarksDrawerCloseSubject.subscribe(closeBookmarks)
  }

  function openBookmarks() {
    $root.classList.add(styles.bookmarksDrawerOpen)
    bookmarksDrawerModeSubject.next("toggleOpen")
  }

  function closeBookmarks() {
    $root.classList.remove(styles.bookmarksDrawerOpen)
    bookmarksDrawerModeSubject.next("toggleClosed")
  }
}
