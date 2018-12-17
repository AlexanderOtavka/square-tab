import React, { useMemo, useEffect, useCallback, useState } from "react"
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

const getBookmarkTitle = ({ id, url, title }) => {
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

  // Hover state

  const [currentHoveredElement, setHoveredElement] = useState(null)
  const [currentTooltipText, setTooltipText] = useState("")

  const onTooltipMouseOver = useCallback(ev => {
    const el = ev.currentTarget
    if (el && el.dataset.tooltip) {
      setHoveredElement(el)
      setTooltipText(el.dataset.tooltip)
    }
  }, [])

  const onTooltipMouseLeave = useCallback(ev => {
    const el = ev.currentTarget
    if (el && el.dataset.tooltip) {
      setHoveredElement(null)
      setTooltipText("")
    }
  }, [])

  // Drag and drop

  const [draggedId, setDraggedId] = useState(null)
  const [draggedOverId, setDraggedOverId] = useState(null)

  const onBookmarkPickUp = useCallback(id => {
    setDraggedId(id)
  }, [])

  const getYFraction = ev => {
    const rect = ev.currentTarget.getBoundingClientRect()
    return (rect.top - ev.y) / rect.height
  }

  const onBookmarkDragOver = useCallback(
    ev => {
      ev.preventDefault()

      ev.dataTransfer.dropEffect = "move"

      const { id } = ev.currentTarget.dataset
      if (id !== draggedOverId) {
        setDraggedOverId(id)
      }
    },
    [draggedOverId]
  )

  const dropBookmark = useCallback((id, index) => {
    // if (draggedId) {
    //   chrome.bookmarks.move(draggedId, {
    //     parentId: currentFolder.id,
    //     index: items.findIndex(x => x.id === id)
    //   })
    // }

    setDraggedId(null)
    setDraggedOverId(null)
  }, [])

  const onBookmarkDrop = useCallback(
    ev => {
      ev.preventDefault()

      const bookmarkId = ev.dataTransfer.getData("text/x-bookmark-id") || null
      const title = ev.dataTransfer.getData("text/plain")
      const url = ev.dataTransfer.getData("text/uri-list") || title

      const { id } = ev.currentTarget.dataset

      dropBookmark(draggedId, items.findIndex(x => x.id === id))
    },
    [draggedId, currentFolder.id, items]
  )

  const getTransformClassName = index => {
    const draggedIndex = items.findIndex(x => x.id === draggedId)
    if (draggedIndex === -1) {
      return ""
    } else if (index === draggedIndex) {
      return styles.invisible
    } else {
      const draggedOverIndex = items.findIndex(x => x.id === draggedOverId)
      if (draggedIndex < index && index <= draggedOverIndex) {
        return styles.translateUp
      } else if (draggedOverIndex <= index && index < draggedIndex) {
        return styles.translateDown
      } else {
        return ""
      }
    }
  }

  const [isDraggingOverItems, setDraggingOverItems] = useState(false)
  const onItemsDragOver = useCallback(
    ev => {
      ev.preventDefault()

      if (!isDraggingOverItems) {
        setDraggingOverItems(true)
      }
    },
    [isDraggingOverItems]
  )
  const onItemsDrop = useCallback(
    ev => {
      ev.preventDefault()

      setDraggingOverItems(false)

      if (ev.target === ev.currentTarget) {
        dropBookmark(draggedId, items.length - 1)
      }
    },
    [draggedId, items.length]
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
          <header
            className={classnames(className, "toolbar")}
            data-tooltip={getBookmarkTitle(currentFolder)}
            onMouseOver={onTooltipMouseOver}
            onMouseLeave={onTooltipMouseLeave}
          >
            <IconButton
              className={styles.bookmarksUpButton}
              icon={isAtRoot ? <FolderSvg /> : <FolderUpSvg />}
              disabled={isAtRoot}
              onClick={onUpClick}
            />
            <span className={classnames(styles.bookmarksDrawerTitle, "title")}>
              {getBookmarkTitle(currentFolder)}
            </span>
            <IconButton
              className={styles.bookmarksCloseButton}
              icon={<CloseSvg />}
              onClick={onClose}
            />
          </header>
        )}
        renderContents={className => (
          <ul
            className={classnames(
              className,
              styles.bookmarksDrawerItems,
              isDraggingOverItems && styles.dragOver
            )}
            onDragOver={onItemsDragOver}
            onDrop={onItemsDrop}
          >
            {items.map((item, index) => (
              <li
                className={styles.bookmarkLi}
                key={item.id}
                data-id={item.id}
                onDragEnter={onBookmarkDragOver}
                onDragOver={onBookmarkDragOver}
                onDrop={onBookmarkDrop}
              >
                <Bookmark
                  className={classnames(
                    styles.bookmark,
                    getTransformClassName(index)
                  )}
                  id={item.id}
                  title={getBookmarkTitle(item)}
                  data-tooltip={getBookmarkTitle(item)}
                  url={item.url}
                  isSmall={isSmall}
                  onOpenFolder={onOpenFolder}
                  onMouseOver={onTooltipMouseOver}
                  onMouseLeave={onTooltipMouseLeave}
                  onPickUp={onBookmarkPickUp}
                />
              </li>
            ))}
          </ul>
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

      {isSmall && (
        <Tooltip
          className={styles.tooltip}
          name={currentTooltipText}
          showOnElement={currentHoveredElement}
        />
      )}

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
