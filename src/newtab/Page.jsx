import React, { useRef, useEffect, useCallback } from "react"
import classnames from "classnames"
import { BehaviorSubject } from "rxjs"

import unpackRefs from "./unpackRefs"
import createBookmarksNavigator from "./createBookmarksNavigator"
import createBookmarksEditor from "./createBookmarksEditor"
import createPage from "./createPage"
import CallbackSubject from "../CallbackSubject"

import Weather from "./Weather"
import Drawer from "./Drawer"

import useConst from "../useConst"
import useBehaviorSubject from "../useBehaviorSubject"

import "./x-bookmark"
import "./x-context-menu"
import "./x-dialog"
import "./x-icon"
import "./x-tooltip"

import styles from "./Page.css"

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
  const $bookmarksCloseButton = useRef() //document.querySelector( ".bookmarksCloseButton")
  const $bookmarksDrawerHeader = useRef() //document.querySelector( ".bookmarksDrawer .drawerHeader")
  const $bookmarksUpButton = useRef() //document.querySelector(".bookmarksUpButton")
  const $bookmarksDrawerItems = useRef() //document.querySelector( ".bookmarksDrawer-items")

  const $drawer = useRef() // document.querySelector(".bookmarksDrawer")
  const $ctxMenu = useRef() // document.querySelector("#bookmarks-ctx-menu")
  const $ctxMenuName = useRef() //document.querySelector("#bookmarks-ctx-menu-name")
  const $ctxMenuEdit = useRef() //document.querySelector("#bookmarks-ctx-menu-edit")
  const $ctxMenuDelete = useRef() //document.querySelector("#bookmarks-ctx-menu-delete")
  const $ctxMenuAddPage = useRef() //document.querySelector( "#bookmarks-ctx-menu-add-page")
  const $ctxMenuAddFolder = useRef() // document.querySelector( "#bookmarks-ctx-menu-add-folder")
  const $editDialog = useRef() // document.querySelector("#bookmarks-edit-dialog")
  const $editDialogFavicon = useRef() // document.querySelector( "#bookmarks-edit-dialog-favicon")
  const $editDialogTitle = useRef() // document.querySelector( "#bookmarks-edit-dialog-title")
  const $editDialogName = useRef() // document.querySelector(".bookmarksEditDialogName")
  const $editDialogURL = useRef() // document.querySelector(".bookmarksEditDialogUrl")
  const $editDialogDone = useRef() // document.querySelector( "#bookmarks-edit-dialog-done")

  const $bookmarksDrawerTitle = useRef() // document.querySelector(".bookmarksDrawer .title")
  const $drawerTooltip = useRef() //document.querySelector(".bookmarksDrawer-tooltip")

  const bookmarksDrawerModeSubject = useConst(new BehaviorSubject("toggle"))
  const bookmarksDrawerPositionSubject = useConst(new BehaviorSubject("right"))
  const bookmarksDrawerCloseSubject = useConst(new CallbackSubject())

  useEffect(() => {
    const bookmarksNavigator = createBookmarksNavigator(
      unpackRefs({
        $header: $bookmarksDrawerHeader,
        $upButton: $bookmarksUpButton,
        $title: $bookmarksDrawerTitle,
        $drawerItems: $bookmarksDrawerItems,
        $drawerTooltip
      })
    )

    createBookmarksEditor(
      unpackRefs({
        $drawer,
        $drawerHeader: $bookmarksDrawerHeader,
        $upButton: $bookmarksUpButton,
        $drawerItems: $bookmarksDrawerItems,
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
      }),
      bookmarksNavigator
    )

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
      bookmarksDrawerCloseSubject
    )
  }, [])

  const bookmarksDrawerMode = useBehaviorSubject(bookmarksDrawerModeSubject)
  const bookmarksDrawerPosition = useBehaviorSubject(
    bookmarksDrawerPositionSubject
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

      <Drawer
        ref={$drawer}
        className={styles.bookmarksDrawer}
        mode={bookmarksDrawerMode}
        position={bookmarksDrawerPosition}
        onClose={bookmarksDrawerCloseSubject.callback}
        renderHeader={className => (
          <header
            ref={$bookmarksDrawerHeader}
            className={classnames(className, "toolbar")}
          >
            <x-icon
              ref={$bookmarksUpButton}
              class={styles.bookmarksUpButton}
              large
            />
            <span
              ref={$bookmarksDrawerTitle}
              className={classnames(styles.bookmarksDrawerTitle, "title")}
            />
            <x-icon
              ref={$bookmarksCloseButton}
              class={styles.bookmarksCloseButton}
              icon="close"
              large
              button
            />
          </header>
        )}
        renderContents={className => (
          <nav
            ref={$bookmarksDrawerItems}
            className={classnames(className, styles.bookmarksDrawerItems)}
          />
        )}
      />

      <x-dialog ref={$editDialog} class={styles.bookmarksEditDialog}>
        <img slot="title" ref={$editDialogFavicon} />
        <h1 slot="title" ref={$editDialogTitle} />

        <div slot="content" className="row">
          <input
            ref={$editDialogName}
            className={styles.bookmarksEditDialogName}
            type="text"
            placeholder="Name"
          />
          <input
            ref={$editDialogURL}
            className={styles.bookmarksEditDialogUrl}
            type="url"
            placeholder="URL"
          />
        </div>

        <button slot="cancel">Cancel</button>
        <button slot="confirm" ref={$editDialogDone}>
          Done
        </button>
      </x-dialog>

      <x-tooltip ref={$drawerTooltip} />

      <x-context-menu ref={$ctxMenu}>
        <div ref={$ctxMenuName} className="menu-item disabled line-below" />

        <div ref={$ctxMenuEdit} className="menu-item">
          Edit
        </div>
        <div ref={$ctxMenuDelete} className="menu-item">
          Delete
        </div>
        <hr />
        <div ref={$ctxMenuAddPage} className="menu-item">
          Add Page
        </div>
        <div ref={$ctxMenuAddFolder} className="menu-item">
          Add Folder
        </div>
      </x-context-menu>
    </>
  )
}
