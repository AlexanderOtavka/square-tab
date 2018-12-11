import React, { useRef, useEffect } from "react"
import classnames from "classnames"

import createBookmarksNavigator from "./createBookmarksNavigator"
import createBookmarksEditor from "./createBookmarksEditor"
import unpackRefs from "./unpackRefs"

import Drawer from "./Drawer"
import Tooltip from "./Tooltip"

import styles from "./BookmarksDrawer.css"

const modeToClassName = mode => {
  switch (mode) {
    case "toggleOpen":
    case "toggleClosed":
      return styles.modeToggle
    case "always":
      return styles.modeAlways
    case "hover":
      return styles.modeHover
    case "never":
      return styles.modeNever
  }
}

export default function BookmarksDrawer({
  isSmall,
  className,
  ...drawerProps
}) {
  const $drawer = useRef() // document.querySelector(".bookmarksDrawer")
  const $header = useRef() //document.querySelector( ".bookmarksDrawer .drawerHeader")
  const $upButton = useRef() //document.querySelector(".bookmarksUpButton")
  const $drawerItems = useRef() //document.querySelector( ".bookmarksDrawer-items")
  const $title = useRef() // document.querySelector(".bookmarksDrawer .title")

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

  const $drawerTooltip = useRef() //document.querySelector(".bookmarksDrawer-tooltip")

  useEffect(() => {
    const bookmarksNavigator = createBookmarksNavigator(
      unpackRefs({
        $header: $header,
        $upButton: $upButton,
        $title: $title,
        $drawerItems: $drawerItems,
        $drawerTooltip
      })
    )

    createBookmarksEditor(
      unpackRefs({
        $drawer,
        $drawerHeader: $header,
        $upButton: $upButton,
        $drawerItems: $drawerItems,
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
  }, [])

  const $closeButton = useRef()
  useEffect(
    () => {
      const onClick = () => drawerProps.onClose()
      $closeButton.current.addEventListener("click", onClick)
      return () => {
        $closeButton.current.removeEventListener("click", onClick)
      }
    },
    [$closeButton.current, drawerProps.onClose]
  )

  return (
    <>
      <Drawer
        {...drawerProps}
        ref={$drawer}
        className={classnames(
          className,
          styles.bookmarksDrawer,
          isSmall && styles.isSmall,
          modeToClassName(drawerProps.mode)
        )}
        renderHeader={className => (
          <header ref={$header} className={classnames(className, "toolbar")}>
            <x-icon ref={$upButton} class={styles.bookmarksUpButton} large />
            <span
              ref={$title}
              className={classnames(styles.bookmarksDrawerTitle, "title")}
            />
            <x-icon
              ref={$closeButton}
              class={styles.bookmarksCloseButton}
              icon="close"
              large
              button
            />
          </header>
        )}
        renderContents={className => (
          <nav
            ref={$drawerItems}
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

      <Tooltip ref={$drawerTooltip} className={styles.tooltip} />

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
