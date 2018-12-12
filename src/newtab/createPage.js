import * as Surprise from "../Surprise"
import * as Settings from "../Settings"
import getSunInfoMs from "./getSunInfoMs"

import styles from "./Page.css"

export default function createPage(
  { $root, $bookmarksOpenButton },
  bookmarksDrawerModeSubject,
  bookmarksDrawerPositionSubject,
  bookmarksDrawerIsSmallSubject,
  bookmarksDrawerCloseSubject
) {
  disableDefaultRightClick()
  addSettingsChangeListeners()
  addGlobalDragDropListeners()
  addBookmarksDrawerListeners()

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
