import React, { useRef, useEffect, useState } from "react"
import classnames from "classnames"
import { BehaviorSubject } from "rxjs"

import unpackRefs from "./unpackRefs"
import createPage from "./createPage"
import CallbackSubject from "../util/CallbackSubject"
import * as Settings from "../Settings"

import Weather from "./Weather"
import BookmarksDrawer from "./BookmarksDrawer"

import useConst from "../util/useConst"
import useBehaviorSubject from "../util/useBehaviorSubject"
import useBackgroundImage from "./useBackgroundImage"

import "./x-bookmark"
import "./x-context-menu"
import "./x-dialog"
import "./x-icon"

import styles from "./Page.css"

export default function Page({ weatherStore }) {
  const $root = useRef(document.documentElement)
  const $body = useRef(document.body)
  const $time = useRef() //document.querySelector(".time")
  const $greeting = useRef() //document.querySelector("#greeting")
  const $bookmarksOpenButton = useRef() //document.querySelector(".bookmarksOpenButton")

  const bookmarksDrawerModeSubject = useConst(new BehaviorSubject("toggle"))
  const bookmarksDrawerPositionSubject = useConst(new BehaviorSubject("right"))
  const bookmarksDrawerIsSmallSubject = useConst(new BehaviorSubject(false))
  const bookmarksDrawerCloseSubject = useConst(new CallbackSubject())

  useEffect(() => {
    createPage(
      unpackRefs({
        $root,
        $time,
        $greeting,
        $bookmarksOpenButton
      }),
      weatherStore,
      bookmarksDrawerModeSubject,
      bookmarksDrawerPositionSubject,
      bookmarksDrawerIsSmallSubject,
      bookmarksDrawerCloseSubject
    )
  }, [])

  // Background image

  const backgroundImage = useBackgroundImage()

  // Resolve the body when everything is ready

  const [settingsAreLoaded, setSettingsLoaded] = useState(false)
  const [weatherCacheIsLoaded, setWeatherCacheLoaded] = useState(false)
  useEffect(() => {
    Settings.loaded.then(() => setSettingsLoaded(true))
    weatherStore.cacheLoaded.then(() => setWeatherCacheLoaded(true))
  }, [])

  useEffect(
    () => {
      if (
        settingsAreLoaded &&
        weatherCacheIsLoaded &&
        backgroundImage.cacheIsLoaded
      ) {
        $body.current.removeAttribute("unresolved")
        $body.current.animate([{ opacity: 0 }, { opacity: 1 }], {
          duration: 200,
          easing: "cubic-bezier(0.215, 0.61, 0.355, 1)"
        })
      }
    },
    [settingsAreLoaded && weatherCacheIsLoaded && backgroundImage.cacheIsLoaded]
  )

  // Bookmarks drawer mode

  const bookmarksDrawerMode = useBehaviorSubject(bookmarksDrawerModeSubject)
  const bookmarksDrawerPosition = useBehaviorSubject(
    bookmarksDrawerPositionSubject
  )
  const bookmarksDrawerIsSmall = useBehaviorSubject(
    bookmarksDrawerIsSmallSubject
  )

  return (
    <>
      <img
        className={classnames(styles.backgroundImage, "fullbleed")}
        src={backgroundImage.dataUrl}
      />

      <header className={classnames(styles.mainToolbar, "toolbar")}>
        <a
          className={styles.sourceLink}
          target="_blank"
          href="https://unsplash.com/"
        >
          Unsplash
        </a>
        <a
          className={styles.sourceLink}
          target="_blank"
          href={backgroundImage.sourceUrl}
        >
          Photo
        </a>

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
        <div className={styles.infoBox}>
          <a
            ref={$time}
            className={styles.time}
            href="https://www.google.com/search?q=time"
          />
          <div ref={$greeting} />
          <Weather store={weatherStore} />
        </div>
      </main>

      <BookmarksDrawer
        mode={bookmarksDrawerMode}
        position={bookmarksDrawerPosition}
        isSmall={bookmarksDrawerIsSmall}
        onClose={bookmarksDrawerCloseSubject.callback}
      />
    </>
  )
}
