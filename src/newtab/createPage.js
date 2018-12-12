import * as Settings from "../Settings"

import styles from "./Page.css"

export default function createPage({ $root }) {
  Settings.onChanged(Settings.keys.BOOKMARKS_DRAWER_MODE).subscribe(
    updateBookmarkDrawerMode
  )

  Settings.onChanged(Settings.keys.BOOKMARKS_DRAWER_POSITION).subscribe(
    updateBookmarkDrawerPosition
  )

  Settings.onChanged(Settings.keys.BOOKMARKS_DRAWER_SMALL).subscribe(
    updateBookmarkDrawerSmall
  )

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
}
