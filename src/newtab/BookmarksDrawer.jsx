import React, { useRef, useEffect, useCallback, useState } from "react"
import classnames from "classnames"

import Drawer from "./Drawer"
import Tooltip from "./Tooltip"
import IconButton from "./IconButton"
import CloseSvg from "./icons/CloseSvg"
import FolderSvg from "./icons/FolderSvg"
import FolderUpSvg from "./icons/FolderUpSvg"

import styles from "./BookmarksDrawer.css"

const ROOT_ID = "0"
const BOOKMARKS_BAR_ID = "1"
const OTHER_BOOKMARKS_ID = "2"
const MOBILE_BOOKMARKS_ID = "2"

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

const getNodeTitle = ({ id, url, title }) => {
  if (title || url) {
    return title || url
  } else if (id === ROOT_ID) {
    return "Bookmarks"
  } else {
    return "(Untitled Folder)"
  }
}

export default function BookmarksDrawer({
  isSmall,
  className,
  ...drawerProps
}) {
  const [currentFolder, setCurrentFolder] = useState({
    id: BOOKMARKS_BAR_ID,
    parentId: "",
    title: ""
  })
  useEffect(
    () => {
      chrome.bookmarks.get(currentFolder.id, ([node]) => {
        setCurrentFolder(node)
      })

      const onChange = (id, changes) => {
        if (id === currentFolder.id) {
          setFolderTitle(changes.title)
        }
      }

      chrome.bookmarks.onChanged.addListener(onChange)
      return () => {
        chrome.bookmarks.onChanged.removeListener(onChange)
      }
    },
    [currentFolder.id]
  )

  const isAtRoot = currentFolder.id === ROOT_ID

  const [items, setItems] = useState([])
  useEffect(
    () => {
      chrome.bookmarks.getChildren(currentFolder.id, setItems)
    },
    [currentFolder.id]
  )

  const onUpClick = useCallback(
    () => {
      chrome.bookmarks.get(currentFolder.parentId, ([node]) => {
        setCurrentFolder(node)
      })
    },
    [currentFolder.parentId]
  )

  const onClose = useCallback(() => drawerProps.onClose(), [
    drawerProps.onClose
  ])

  return (
    <>
      <Drawer
        {...drawerProps}
        className={classnames(
          className,
          styles.bookmarksDrawer,
          isSmall && styles.isSmall,
          modeToClassName(drawerProps.mode)
        )}
        renderHeader={className => (
          <header className={classnames(className, "toolbar")}>
            <IconButton
              className={styles.bookmarksUpButton}
              icon={isAtRoot ? <FolderSvg /> : <FolderUpSvg />}
              disabled={isAtRoot}
              onClick={onUpClick}
            />
            <span className={classnames(styles.bookmarksDrawerTitle, "title")}>
              {getNodeTitle(currentFolder)}
            </span>
            <IconButton
              className={styles.bookmarksCloseButton}
              icon={<CloseSvg />}
              onClick={onClose}
            />
          </header>
        )}
        renderContents={className => (
          <nav className={classnames(className, styles.bookmarksDrawerItems)}>
            {items.map(item => (
              <x-bookmark
                key={item.id}
                ref={bookmarkElement =>
                  bookmarkElement &&
                  ((bookmarkElement.node = item),
                  (bookmarkElement.small = isSmall))
                }
              />
            ))}
          </nav>
        )}
      />

      <x-dialog class={styles.bookmarksEditDialog}>
        <img slot="title" />
        <h1 slot="title" />

        <div slot="content" className="row">
          <input
            className={styles.bookmarksEditDialogName}
            type="text"
            placeholder="Name"
          />
          <input
            className={styles.bookmarksEditDialogUrl}
            type="url"
            placeholder="URL"
          />
        </div>

        <button slot="cancel">Cancel</button>
        <button slot="confirm">Done</button>
      </x-dialog>

      {/* <Tooltip className={styles.tooltip} /> */}

      <x-context-menu>
        <div className="menu-item disabled line-below" />

        <div className="menu-item">Edit</div>
        <div className="menu-item">Delete</div>
        <hr />
        <div className="menu-item">Add Page</div>
        <div className="menu-item">Add Folder</div>
      </x-context-menu>
    </>
  )
}
