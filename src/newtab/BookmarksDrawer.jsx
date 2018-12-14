import React, { useRef, useEffect, useCallback, useState } from "react"
import classnames from "classnames"

import Drawer from "./Drawer"
import Tooltip from "./Tooltip"
import IconButton from "./IconButton"
import Bookmark from "./Bookmark"
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

const getBookmark = id =>
  new Promise((resolve, reject) =>
    chrome.bookmarks.get(id, nodes => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
      else resolve(nodes[0])
    })
  )

export default function BookmarksDrawer({
  isSmall,
  className,
  ...drawerProps
}) {
  // Current folder

  const [currentFolder, setCurrentFolder] = useState({
    id: "",
    parentId: "",
    title: ""
  })

  const onOpenFolder = useCallback(id => {
    getBookmark(id).then(setCurrentFolder)
  }, [])

  const onUpClick = useCallback(
    () => {
      onOpenFolder(currentFolder.parentId)
    },
    [onOpenFolder, currentFolder.parentId]
  )

  useEffect(() => {
    onOpenFolder(BOOKMARKS_BAR_ID)
  }, [])

  // Changes to the current folder
  useEffect(
    () => {
      if (currentFolder.id) {
        const onChange = (id, changes) => {
          if (id === currentFolder.id) {
            setCurrentFolder(folder => ({ ...folder, ...changes }))
          }
        }

        const onMoveOrRemove = () => {
          getBookmark(currentFolder.id).catch(() => {
            onOpenFolder(BOOKMARKS_BAR_ID)
          })
        }

        chrome.bookmarks.onChanged.addListener(onChange)
        chrome.bookmarks.onRemoved.addListener(onMoveOrRemove)
        chrome.bookmarks.onMoved.addListener(onMoveOrRemove)
        return () => {
          chrome.bookmarks.onChanged.removeListener(onChange)
          chrome.bookmarks.onRemoved.removeListener(onMoveOrRemove)
          chrome.bookmarks.onMoved.removeListener(onMoveOrRemove)
        }
      }
    },
    [currentFolder.id]
  )

  const isAtRoot = !currentFolder.parentId

  // Current folder contents

  const [items, setItems] = useState([])

  // Changes involving the current folder and affecting the contents
  useEffect(
    () => {
      if (currentFolder.id) {
        const reloadChildren = () =>
          chrome.bookmarks.getChildren(currentFolder.id, children => {
            if (chrome.runtime.lastError)
              console.error(chrome.runtime.lastError)
            else setItems(children)
          })

        reloadChildren()

        const onCreateOrRemove = (_id, { parentId }) => {
          if (parentId === currentFolder.id) {
            reloadChildren()
          }
        }

        const onMove = (_id, { parentId, oldParentId }) => {
          if (
            parentId === currentFolder.id ||
            oldParentId === currentFolder.id
          ) {
            reloadChildren()
          }
        }

        const onChildrenReordered = id => {
          if (id === currentFolder.id) {
            reloadChildren()
          }
        }

        chrome.bookmarks.onCreated.addListener(onCreateOrRemove)
        chrome.bookmarks.onRemoved.addListener(onCreateOrRemove)
        chrome.bookmarks.onMoved.addListener(onMove)
        chrome.bookmarks.onChildrenReordered.addListener(onChildrenReordered)
        return () => {
          chrome.bookmarks.onCreated.removeListener(onCreateOrRemove)
          chrome.bookmarks.onRemoved.removeListener(onCreateOrRemove)
          chrome.bookmarks.onMoved.removeListener(onMove)
          chrome.bookmarks.onChildrenReordered.removeListener(
            onChildrenReordered
          )
        }
      }
    },
    [currentFolder.id]
  )

  // Changes of individual items
  useEffect(
    () => {
      const onChange = (id, changes) => {
        if (items.some(item => item.id === id)) {
          setItems(items =>
            items.map(item => (item.id === id ? { ...item, ...changes } : item))
          )
        }
      }

      chrome.bookmarks.onChanged.addListener(onChange)
      return () => {
        chrome.bookmarks.onChanged.removeListener(onChange)
      }
    },
    [items]
  )

  // Other callbacks

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
              <Bookmark
                key={item.id}
                id={item.id}
                title={item.title}
                url={item.url}
                isSmall={isSmall}
                onOpenFolder={onOpenFolder}
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
