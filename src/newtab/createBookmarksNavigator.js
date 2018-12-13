// @ts-check

import * as Settings from "../Settings"

// @ts-ignore
import { bookmarksUpButton as upButtonClassName } from "./BookmarksDrawer.css"

export const ROOT_ID = "0"
export const BOOKMARKS_BAR_ID = "1"
export const OTHER_BOOKMARKS_ID = "2"
export const MOBILE_BOOKMARKS_ID = "2"

export default function createBookmarksNavigator({
  $header,
  $upButton,
  $title,
  $drawerItems,
  $drawerTooltip
}) {
  let stack = [ROOT_ID, BOOKMARKS_BAR_ID]

  openBookmark(getCurrentFolder())

  chrome.bookmarks.onCreated.addListener((id, node) => {
    if (node.parentId === getCurrentFolder()) {
      createOrUpdateElement(node)
    }
  })

  chrome.bookmarks.onRemoved.addListener((id, { parentId, index }) => {
    if (parentId === getCurrentFolder()) {
      deleteElementByIndex(index)
    } else if (stack.indexOf(id) !== -1) {
      stack.splice(stack.indexOf(id))
      openBookmark(getCurrentFolder())
    }
  })

  chrome.bookmarks.onMoved.addListener((id, moveInfo) => {
    if (
      moveInfo.parentId === getCurrentFolder() &&
      moveInfo.oldParentId === getCurrentFolder()
    ) {
      const element = $drawerItems.childNodes[moveInfo.oldIndex]
      if (element.node.id === id) {
        $drawerItems.removeChild(element)

        const beforeElement = $drawerItems.childNodes[moveInfo.index]
        console.assert(beforeElement ? beforeElement.node.id !== id : true)
        $drawerItems.insertBefore(element, beforeElement)
      }
    } else if (moveInfo.parentId === getCurrentFolder()) {
      chrome.bookmarks.get(id, ([node]) => {
        createOrUpdateElement(node)
      })
    } else if (moveInfo.oldParentId === getCurrentFolder()) {
      deleteElementByIndex(moveInfo.oldIndex)
    } else if (stack.indexOf(id) !== -1) {
      generateStackFrom(id).then(newStack => {
        stack = newStack
        openBookmark(getCurrentFolder())
      })
    }
  })

  chrome.bookmarks.onChanged.addListener((id, changes) => {
    const element = elements().find(el => el.node.id === id)
    if (element) {
      element.node = Object.assign(element.node, changes)
    }
  })

  chrome.bookmarks.onChildrenReordered.addListener(id => {
    if (id === getCurrentFolder()) {
      openBookmark(getCurrentFolder())
    }
  })

  // Drawer Click Listeners

  $upButton.addEventListener("click", () => {
    ascend()
  })

  $drawerItems.addEventListener(
    "x-bookmark-click",
    ev => {
      openBookmark(ev.detail.nodeId)
    },
    true
  )

  // Add settings listeners

  Settings.onChanged(Settings.keys.BOOKMARKS_DRAWER_SMALL).subscribe(updateSize)

  // Add Tooltip Listeners

  $drawerItems.addEventListener(
    "x-bookmark-mouseover",
    onBookmarkMouseOver,
    true
  )
  $drawerItems.addEventListener("x-bookmark-mouseleave", hideTooltip, true)

  $header.addEventListener("mouseover", onHeaderMouseOver)
  $header.addEventListener("mouseleave", hideTooltip)

  return {
    getCurrentFolder,
    getParentFolder,
    maybeShowTooltipForBookmark,
    hideTooltip,
    getNodeTitle,
    nodeIsEditable
  }

  function getCurrentFolder() {
    return stack[stack.length - 1]
  }

  function getParentFolder() {
    return stack.length > 1 ? stack[stack.length - 2] : null
  }

  /**
   * Show the tooltip over given bookmark if the drawer is small.
   *
   * @param bookmark The bookmark node
   */
  function maybeShowTooltipForBookmark(bookmark) {
    if (Settings.get(Settings.keys.BOOKMARKS_DRAWER_SMALL)) {
      $drawerTooltip.show(bookmark, getNodeTitle(bookmark.node))
    }
  }

  function hideTooltip() {
    $drawerTooltip.hide()
  }

  function onBookmarkMouseOver(ev) {
    maybeShowTooltipForBookmark(ev.target)
  }

  function onHeaderMouseOver() {
    if (Settings.get(Settings.keys.BOOKMARKS_DRAWER_SMALL)) {
      $drawerTooltip.show($header, $title.title)
    }
  }

  function getNodeTitle({ id, url, title }) {
    if (title || url) {
      return title || url
    } else if (id === ROOT_ID) {
      return "Bookmarks"
    } else {
      return "(Untitled Folder)"
    }
  }

  function nodeIsEditable(nodeId) {
    return (
      nodeId &&
      nodeId !== ROOT_ID &&
      nodeId !== BOOKMARKS_BAR_ID &&
      nodeId !== OTHER_BOOKMARKS_ID &&
      nodeId !== MOBILE_BOOKMARKS_ID
    )
  }

  function openBookmark(id) {
    if (id !== getCurrentFolder()) {
      stack.push(id)
    }

    updateUpButton()

    chrome.bookmarks.get(id, ([node]) => {
      if (!node.url) {
        // @ts-ignore
        const title = getNodeTitle(node)
        $title.textContent = title
        $title.title = title

        chrome.bookmarks.getChildren(id, children => {
          const elements = $drawerItems.childNodes

          while (children.length < elements.length) {
            $drawerItems.removeChild($drawerItems.lastChild)
          }

          children.forEach((child, i) => {
            const bookmark = elements[i]
            if (!bookmark) {
              createOrUpdateElement(child)
            } else {
              bookmark.node = child
            }
          })

          const $hoveredBookmark = $drawerItems.querySelector(
            "x-bookmark:hover"
          )
          if ($hoveredBookmark) {
            $drawerTooltip.name = getNodeTitle($hoveredBookmark.node)
          } else if (document.querySelector(`.${upButtonClassName}:hover`)) {
            $drawerTooltip.name = title
          } else {
            hideTooltip()
          }
        })
      }
    })
  }

  function ascend() {
    if (!isTop()) {
      stack.pop()
      openBookmark(getCurrentFolder())
    }
  }

  function updateSize(small) {
    elements().forEach(element => {
      element.small = small
    })
  }

  function isTop() {
    return stack.length === 1
  }

  function elements() {
    return Array.prototype.slice.call($drawerItems.childNodes)
  }

  function createOrUpdateElement(node) {
    const beforeElement = $drawerItems.childNodes[node.index]
    let bookmark
    if (
      beforeElement &&
      (!beforeElement.node || beforeElement.node.id === node.id)
    ) {
      bookmark = beforeElement
    } else {
      bookmark = document.createElement("x-bookmark")
      $drawerItems.insertBefore(bookmark, beforeElement)
    }

    bookmark.small = Settings.get(Settings.keys.BOOKMARKS_DRAWER_SMALL)
    bookmark.node = node
  }

  function deleteElementByIndex(index) {
    const element = $drawerItems.childNodes[index]
    $drawerItems.removeChild(element)
  }

  function generateStackFrom(id, stack = []) {
    return new Promise(resolve => {
      stack.splice(0, 0, id)
      chrome.bookmarks.get(id, ([node]) => {
        if (node.parentId) {
          resolve(generateStackFrom(node.parentId, stack))
        } else {
          resolve(stack)
        }
      })
    })
  }

  function updateUpButton() {
    if (isTop()) {
      $upButton.icon = "folder"
      $upButton.button = false
    } else {
      $upButton.icon = "folder-up"
      $upButton.button = true
    }
  }
}
