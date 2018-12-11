import React, { useRef, useEffect } from "react"
import classnames from "classnames"
import { BehaviorSubject } from "rxjs"

import unpackRefs from "./unpackRefs"
import createPage from "./createPage"
import CallbackSubject from "../CallbackSubject"

import Weather from "./Weather"

import useConst from "../useConst"
import useBehaviorSubject from "../useBehaviorSubject"

import "./x-bookmark"
import "./x-context-menu"
import "./x-dialog"
import "./x-icon"
import "./x-tooltip"

import styles from "./Page.css"
import BookmarksDrawer from "./BookmarksDrawer"

export default function Page({ weatherStore }) {
  const $root = useRef(document.documentElement)
  const $body = useRef(document.body)
  const $backgroundImage = useRef() // document.querySelector("#background-image")
  const $surpriseLink = useRef() // document.querySelector("#surprise-link")
  const $unsplashLink = useRef() //document.querySelector("#unsplash-link")
  const $rawSourceLink = useRef() //document.querySelector("#sourceLink")
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
        $body,
        $backgroundImage,
        $surpriseLink,
        $unsplashLink,
        $rawSourceLink,
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
        ref={$backgroundImage}
        className={classnames(styles.backgroundImage, "fullbleed")}
      />

      <header
        id="main-toolbar"
        className={classnames(styles.mainToolbar, "toolbar")}
      >
        <a ref={$surpriseLink} hidden />
        <a
          ref={$unsplashLink}
          className={styles.sourceLink}
          target="_blank"
          href="https://unsplash.com/"
        >
          Unsplash
        </a>
        <a ref={$rawSourceLink} className={styles.sourceLink} target="_blank">
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

      <main
        id="info-wrapper"
        className={classnames(styles.infoWrapper, "fullbleed")}
      >
        <div id="info-box" className={styles.infoBox}>
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
