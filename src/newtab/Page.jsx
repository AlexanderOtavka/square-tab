import React, {
  useRef,
  useEffect,
  useLayoutEffect,
  useState,
  useCallback
} from "react"
import classnames from "classnames"

import * as Settings from "../Settings"

import Weather from "./Weather"
import BookmarksDrawer from "./BookmarksDrawer"

import useBackgroundImage from "./useBackgroundImage"
import useWeather from "./useWeather"

import "./x-bookmark"
import "./x-context-menu"
import "./x-dialog"
import "./x-icon"

import styles from "./Page.css"
import Clock from "./Clock"

const settingToMode = setting => {
  switch (setting) {
    case Settings.enums.BookmarkDrawerModes.TOGGLE:
      return "toggle"
    case Settings.enums.BookmarkDrawerModes.ALWAYS:
      return "always"
    case Settings.enums.BookmarkDrawerModes.HOVER:
      return "hover"
    case Settings.enums.BookmarkDrawerModes.NEVER:
      return "never"
  }
}

const modeToClassName = mode => {
  switch (mode) {
    case Settings.enums.BookmarkDrawerModes.TOGGLE:
      return styles.bookmarksDrawerModeToggle
    case Settings.enums.BookmarkDrawerModes.ALWAYS:
      return styles.bookmarksDrawerModeAlways
    case Settings.enums.BookmarkDrawerModes.HOVER:
      return styles.bookmarksDrawerModeHover
    case Settings.enums.BookmarkDrawerModes.NEVER:
      return styles.bookmarksDrawerModeNever
  }
}

const positionToClassName = position => {
  switch (position) {
    case Settings.enums.BookmarkDrawerPositions.LEFT:
      return styles.bookmarksDrawerPositionLeft
    case Settings.enums.BookmarkDrawerPositions.RIGHT:
      return styles.bookmarksDrawerPositionRight
  }
}

export default function Page({ weatherStore }) {
  const $bookmarksOpenButton = useRef() //document.querySelector(".bookmarksOpenButton")

  // Settings

  const [settingsAreLoaded, setSettingsLoaded] = useState(false)
  useEffect(() => {
    Settings.loaded.then(() => setSettingsLoaded(true))
  }, [])

  const photoSourceIsShown = Settings.useSetting(
    Settings.keys.SHOW_PHOTO_SOURCE
  )
  const infoIsBoxed = Settings.useSetting(Settings.keys.BOXED_INFO)

  // Weather and background

  const weather = useWeather(weatherStore)

  const backgroundImage = useBackgroundImage(
    settingsAreLoaded && weather.cacheIsLoaded,
    weather.getSunInfo
  )

  // Resolve the body when everything is ready

  const ready =
    settingsAreLoaded && weather.cacheIsLoaded && backgroundImage.cacheIsLoaded
  const pageRef = useRef()
  useLayoutEffect(
    () => {
      if (ready) {
        pageRef.current.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 200,
          easing: "cubic-bezier(0.215, 0.61, 0.355, 1)"
        })
      }
    },
    [ready]
  )

  // Bookmarks drawer

  const bookmarksDrawerMode = Settings.useSetting(
    Settings.keys.BOOKMARKS_DRAWER_MODE
  )
  const bookmarksDrawerPosition = Settings.useSetting(
    Settings.keys.BOOKMARKS_DRAWER_POSITION
  )
  const bookmarksDrawerIsSmall = Settings.useSetting(
    Settings.keys.BOOKMARKS_DRAWER_SMALL
  )

  const [bookmarksDrawerIsOpen, setBookmarksDrawerOpen] = useState(false)
  const onBookmarksDrawerOpen = useCallback(
    () => setBookmarksDrawerOpen(true),
    []
  )
  const onBookmarksDrawerClose = useCallback(
    () => setBookmarksDrawerOpen(false),
    []
  )

  useEffect(
    () => {
      if ($bookmarksOpenButton.current) {
        $bookmarksOpenButton.current.addEventListener(
          "click",
          onBookmarksDrawerOpen
        )
        return () => {
          $bookmarksOpenButton.current.removeEventListener(
            "click",
            onBookmarksDrawerOpen
          )
        }
      }
    },
    [onBookmarksDrawerOpen]
  )

  return (
    <div
      ref={pageRef}
      className={classnames(
        styles.page,
        ready && styles.ready,
        modeToClassName(bookmarksDrawerMode),
        positionToClassName(bookmarksDrawerPosition),
        bookmarksDrawerIsSmall && styles.bookmarksDrawerIsSmall,
        "fullbleed"
      )}
    >
      <img
        className={classnames(styles.backgroundImage, "fullbleed")}
        src={backgroundImage.dataUrl}
      />

      <header className={classnames(styles.mainToolbar, "toolbar")}>
        {photoSourceIsShown && (
          <>
            <a target="_blank" href="https://unsplash.com/">
              Unsplash
            </a>
            <a target="_blank" href={backgroundImage.sourceUrl}>
              Photo
            </a>
          </>
        )}

        <span className="title" />

        <x-icon
          ref={$bookmarksOpenButton}
          class={classnames(styles.bookmarksOpenButton, "radial-shadow")}
          icon="bookmarks"
          large
          button
        />
      </header>

      <main className={classnames(styles.infoWrapper, "fullbleed")}>
        <div
          className={classnames(
            styles.infoBox,
            infoIsBoxed && styles.hasBorder
          )}
        >
          <Clock getSunInfo={weather.getSunInfo} />
          <Weather data={weather.data} getSunInfo={weather.getSunInfo} />
        </div>
      </main>

      <BookmarksDrawer
        mode={settingToMode(bookmarksDrawerMode)}
        position={bookmarksDrawerPosition}
        isSmall={bookmarksDrawerIsSmall}
        isOpen={bookmarksDrawerIsOpen}
        onClose={onBookmarksDrawerClose}
      />
    </div>
  )
}
