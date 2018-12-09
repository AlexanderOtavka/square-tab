import * as BookmarksNavigator from "./BookmarksNavigator.js"
import folderOutlineUri from "./folder-outline.svg"

// todo: add undo popup

export default function createBookmarksEditor(
  {
    $drawer,
    $upButton,
    $drawerItems,
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
  },
  bookmarksNavigator
) {
  let currentDraggedBookmark
  let currentDraggedBookmarkIndex
  let currentDraggedOverBookmarkIndex

  resetDragState()

  $ctxMenu.addEventListener("x-context-menu-close", () => {
    $drawer.classList.remove("ctx-menu-active")
  })

  $editDialog.addEventListener("x-dialog-open", () => {
    requestAnimationFrame(() => $editDialogName.focus())
  })

  $editDialogName.addEventListener("keypress", ev => {
    if (ev.keyCode === 13) {
      $editDialogDone.click()
    }
  })

  $editDialogURL.addEventListener("keypress", ev => {
    if (ev.keyCode === 13) {
      $editDialogDone.click()
    }
  })

  $editDialogURL.addEventListener("change", () => {
    $editDialogURL.value = fixUrl($editDialogURL.value)
  })

  return {
    onBookmarkDragStart,
    onBookmarkDragOver,
    onBookmarkDrop,
    onItemsDragOver,
    onItemsDrop,
    onUpButtonDragOver,
    onUpButtonDragLeave,
    onUpButtonDrop,
    onDragLeave,
    onDragEnd,
    openCtxMenu
  }

  function onBookmarkDragStart(ev) {
    currentDraggedBookmark = ev.target
    currentDraggedBookmarkIndex = Array.prototype.indexOf.call(
      $drawerItems.childNodes,
      ev.target
    )
    currentDraggedOverBookmarkIndex = currentDraggedBookmarkIndex
  }

  function onBookmarkDragOver(ev) {
    const index = Array.prototype.indexOf.call(
      $drawerItems.childNodes,
      ev.target
    )
    handleDragOver(ev.target, index, ev.detail.y)
  }

  function onBookmarkDrop(ev) {
    const index = Array.prototype.indexOf.call(
      $drawerItems.childNodes,
      ev.target
    )
    handleDrop(ev.target, index, ev.detail)
  }

  function onItemsDragOver(ev) {
    ev.preventDefault()

    if (currentDraggedBookmark) {
      ev.dataTransfer.dropEffect = "move"
    } else {
      ev.dataTransfer.dropEffect = "copy"
    }

    $drawerItems.classList.add("drag-over")

    if (ev.target === $drawerItems) {
      handleDragOver(null, $drawerItems.childElementCount, ev.y)
    }
  }

  function onItemsDrop(ev) {
    ev.preventDefault()

    if (ev.target === $drawerItems) {
      const bookmarkId = ev.dataTransfer.getData("text/x-bookmark-id") || null
      const title = ev.dataTransfer.getData("text/plain")
      const url = ev.dataTransfer.getData("text/uri-list") || title
      const index = $drawerItems.childElementCount
      handleDrop(null, index, { bookmarkId, title, url, y: ev.y })
    }
  }

  function onUpButtonDragOver(ev) {
    ev.preventDefault()

    if (currentDraggedBookmark) {
      ev.dataTransfer.dropEffect = "move"
    } else {
      ev.dataTransfer.dropEffect = "copy"
    }

    const parentId = bookmarksNavigator.getParentFolder()
    if (parentId && parentId !== BookmarksNavigator.ROOT_ID) {
      $upButton.classList.add("expand")
    }
  }

  function onUpButtonDragLeave(ev) {
    if (ev.target === $upButton) {
      $upButton.classList.remove("expand")
    }
  }

  function onUpButtonDrop(ev) {
    ev.preventDefault()
    $upButton.classList.remove("expand")

    const parentId = bookmarksNavigator.getParentFolder()
    if (parentId && parentId !== BookmarksNavigator.ROOT_ID) {
      const bookmarkId = ev.dataTransfer.getData("text/x-bookmark-id") || null
      if (bookmarkId) {
        chrome.bookmarks.move(bookmarkId, { parentId })
      } else {
        const title = ev.dataTransfer.getData("text/plain")
        const url = ev.dataTransfer.getData("text/uri-list") || title
        chrome.bookmarks.create({ parentId, title, url })
      }
    }
  }

  function onDragLeave(ev) {
    const rect = $drawerItems.getBoundingClientRect()
    if (
      ev.x < rect.left ||
      ev.x > rect.right ||
      ev.y < rect.top ||
      ev.y > rect.bottom
    ) {
      returnDragHome()
      bookmarksNavigator.hideTooltip()
    }
  }

  function onDragEnd() {
    resetDragState()
  }

  function openCtxMenu(x, y, nodeId) {
    $drawer.classList.add("ctx-menu-active")

    $ctxMenuName.hidden = !nodeId
    if (nodeId) {
      chrome.bookmarks.get(nodeId, ([node]) => {
        $ctxMenuName.textContent = bookmarksNavigator.getNodeTitle(node)
      })
    }

    if (nodeId !== BookmarksNavigator.ROOT_ID) {
      $ctxMenuAddPage.classList.remove("disabled")
      $ctxMenuAddPage.onclick = () => {
        openCreateDialog(false, null)
      }

      $ctxMenuAddFolder.classList.remove("disabled")
      $ctxMenuAddFolder.onclick = () => {
        openCreateDialog(true, null)
      }
    } else {
      $ctxMenuAddPage.classList.add("disabled")
      $ctxMenuAddPage.onclick = () => {}

      $ctxMenuAddFolder.classList.add("disabled")
      $ctxMenuAddFolder.onclick = () => {}
    }

    if (bookmarksNavigator.nodeIsEditable(nodeId)) {
      $ctxMenuEdit.classList.remove("disabled")
      $ctxMenuEdit.onclick = () => {
        openEditDialog(nodeId)
      }

      $ctxMenuDelete.classList.remove("disabled")
      $ctxMenuDelete.onclick = () => {
        chrome.bookmarks.getChildren(nodeId, children => {
          if (children) {
            chrome.bookmarks.removeTree(nodeId)
          } else {
            chrome.bookmarks.remove(nodeId)
          }
        })
      }
    } else {
      $ctxMenuEdit.classList.add("disabled")
      $ctxMenuEdit.onclick = () => {}

      $ctxMenuDelete.classList.add("disabled")
      $ctxMenuDelete.onclick = () => {}
    }

    requestAnimationFrame(() => $ctxMenu.show(x, y))
  }

  /**
   * Add transforms to bookmark elements when something is dragged over.
   *
   * @param {?XBookmarkElement} target The element the mouse is currently over,
   *   or null if the mouse is over empty space.
   * @param {number} targetI The index of the current dragged over bookmark.
   * @param {number} y Y coordinate of the mouse.
   */
  function handleDragOver(target, targetI, y) {
    const startI = currentDraggedBookmarkIndex
    const isDraggingDown = startI < targetI
    const isAtStart = targetI === startI

    const targetId = target
      ? target.node.id
      : bookmarksNavigator.getCurrentFolder()
    const targetIsEditable = bookmarksNavigator.nodeIsEditable(targetId)

    let targetIsExpanded = false

    if (target) {
      const draggedElement = currentDraggedBookmark
      const draggedIsEditable =
        !draggedElement ||
        bookmarksNavigator.nodeIsEditable(draggedElement.node.id)

      if (
        !isAtStart &&
        draggedIsEditable &&
        isFolderDrop(
          target.isFolder,
          targetIsEditable,
          isDraggingDown,
          y,
          target.getBoundingClientRect()
        )
      ) {
        target.classList.add("expand")
        targetIsExpanded = true
      } else {
        target.classList.remove("expand")
      }
    }

    if (targetIsExpanded) {
      bookmarksNavigator.maybeShowTooltipForBookmark(target)
    } else {
      bookmarksNavigator.hideTooltip()
    }

    const isNewTarget = targetI !== currentDraggedOverBookmarkIndex
    if (isNewTarget && (!target || targetIsEditable)) {
      $drawerItems.classList.remove("no-animate-translate")

      const childNodes = $drawerItems.childNodes
      const oldTargetI = Math.min(
        currentDraggedOverBookmarkIndex,
        childNodes.length
      )

      currentDraggedOverBookmarkIndex = targetI

      if (isAtStart) {
        // Back at start
        if (startI < oldTargetI) {
          // When coming out of whitespace, oldTargetI can get too big when
          // incremented, so we ensure it doesn't exceed the length with
          // Math.min().
          for (
            let i = startI + 1;
            i < Math.min(oldTargetI + 1, childNodes.length);
            i++
          ) {
            childNodes[i].classList.remove("translate-up")
          }
        } else if (startI > oldTargetI) {
          for (let i = oldTargetI; i < startI; i++) {
            childNodes[i].classList.remove("translate-down")
          }
        }
      } else if (isDraggingDown) {
        if (oldTargetI < targetI) {
          // When in whitespace, targetI can get too big when incremented, so we
          // ensure it doesn't exceed the length with Math.min().
          for (
            let i = oldTargetI + 1;
            i < Math.min(targetI + 1, childNodes.length);
            i++
          ) {
            childNodes[i].classList.add("translate-up")
            childNodes[i].classList.remove("translate-down")
          }
        }
        // When coming out of whitespace, oldTargetI can get too big when
        // incremented, so we ensure it doesn't exceed the length with
        // Math.min().
        else {
          for (
            let i = targetI + 1;
            i < Math.min(oldTargetI + 1, childNodes.length);
            i++
          ) {
            childNodes[i].classList.remove("translate-up")
          }
        }
      } else if (oldTargetI === targetI) {
        // They are dragging upwards in the whitespace below the bookmarks,
        // meaning they are dragging in an external link/other thing
        console.assert(targetI === childNodes.length)
        const lastChild = $drawerItems.lastChild
        if (lastChild) {
          lastChild.classList.remove("translate-down")
        }
      } else if (oldTargetI > targetI) {
        for (let i = targetI; i < oldTargetI; i++) {
          childNodes[i].classList.add("translate-down")
          childNodes[i].classList.remove("translate-up")
        }
      } else {
        for (let i = oldTargetI; i < targetI; i++) {
          childNodes[i].classList.remove("translate-down")
        }
      }
    }
  }

  /**
   * Move or create bookmarks for drop event within the bookmarks list.
   *
   * @param {?XBookmarkElement} target The bookmark dropped over, or null if
   *   it was dropped over an empty area.
   * @param {number} index The index of the bookmark being dropped on.
   * @param {{bookmarkId: string, title: string, url: string, y: number}} detail
   *   Information about the dragged bookmark/link and the mouse position.
   */
  function handleDrop(target, index, detail) {
    const targetId = target
      ? target.node.id
      : bookmarksNavigator.getCurrentFolder()
    const targetIsEditable = bookmarksNavigator.nodeIsEditable(targetId)

    const draggedElement = currentDraggedBookmark
    const draggedIsEditable =
      !draggedElement ||
      bookmarksNavigator.nodeIsEditable(draggedElement.node.id)

    if (draggedElement && draggedElement !== target && draggedIsEditable) {
      const startI = currentDraggedBookmarkIndex
      const isDraggingDown = startI < index
      const rect = target ? target.getBoundingClientRect() : null

      if (
        target &&
        isFolderDrop(
          target.isFolder,
          targetIsEditable,
          isDraggingDown,
          detail.y,
          rect
        )
      ) {
        target.classList.remove("expand")
        chrome.bookmarks.move(detail.bookmarkId, {
          parentId: target.node.id
        })
      } else {
        let indexOffset = 0
        let beforeElement
        if (target && currentDraggedBookmarkIndex < index) {
          // When we are dragging down, we put it after the current hovered one.
          indexOffset = 1
          beforeElement = target.nextSibling
        } else {
          beforeElement = target
        }

        $drawerItems.removeChild(draggedElement)
        $drawerItems.insertBefore(draggedElement, beforeElement)

        chrome.bookmarks.move(detail.bookmarkId, {
          parentId: bookmarksNavigator.getCurrentFolder(),
          index: index + indexOffset
        })
      }
    } else if (!draggedElement) {
      if (
        target &&
        isFolderDrop(
          target.isFolder,
          targetIsEditable,
          false,
          detail.y,
          target.getBoundingClientRect()
        )
      ) {
        chrome.bookmarks.create({
          parentId: target.node.id,
          title: detail.title,
          url: fixUrl(detail.url)
        })
      } else if (
        bookmarksNavigator.getCurrentFolder() !== BookmarksNavigator.ROOT_ID
      ) {
        const beforeElement = $drawerItems.childNodes[index]
        const bookmark = document.createElement("x-bookmark")
        $drawerItems.insertBefore(bookmark, beforeElement)

        chrome.bookmarks.create({
          parentId: bookmarksNavigator.getCurrentFolder(),
          title: detail.title,
          url: fixUrl(detail.url),
          index
        })
      }
    }

    resetDragState()
  }

  /**
   * Check if a folder is being hovered over to be dropped into.
   *
   * @param {boolean} isFolder Whether the current hovered bookmark is a folder.
   * @param {boolean} isEditable Whether the current hovered bookmark is
   *   editable.
   * @param {boolean} isDraggingDown Whether they are dragging from below or
   *   above the current hovered bookmark.
   * @param {number} y The Y coordinate of the mouse.
   * @param {ClientRect} rect The bounds of the current hovered bookmark.
   */
  function isFolderDrop(isFolder, isEditable, isDraggingDown, y, rect) {
    if (isFolder) {
      if (!isEditable) {
        return true
      }

      const deadWidth = 0.3 * rect.height
      if (isDraggingDown) {
        return rect.bottom - deadWidth > y
      } else {
        return rect.top + deadWidth < y
      }
    } else {
      return false
    }
  }

  function resetDragState() {
    currentDraggedBookmark = null
    currentDraggedBookmarkIndex = Number.MAX_SAFE_INTEGER

    $drawerItems.classList.add("no-animate-translate")

    returnDragHome()
  }

  function returnDragHome() {
    currentDraggedOverBookmarkIndex = currentDraggedBookmarkIndex

    $drawerItems.classList.remove("drag-over")

    const childNodes = $drawerItems.childNodes
    Array.prototype.slice.call(childNodes).forEach(element => {
      element.classList.remove("translate-up")
      element.classList.remove("translate-down")
    })
  }

  function openEditDialog(nodeId) {
    $editDialog.open()

    $editDialogTitle.textContent = "Edit"

    chrome.bookmarks.get(nodeId, ([{ title, url }]) => {
      $editDialogName.value = title || ""
      if (url) {
        $editDialogURL.hidden = false
        $editDialogURL.value = url
        $editDialogFavicon.src = `chrome://favicon/size/16@8x/${url}`
      } else {
        $editDialogURL.hidden = true
        $editDialogFavicon.src = folderOutlineUri
      }
    })

    $editDialogDone.onclick = () => {
      chrome.bookmarks.update(nodeId, {
        title: $editDialogName.value,
        url: $editDialogURL.value
      })
    }
  }

  function openCreateDialog(isFolder, nodeId) {
    $editDialog.open()
    $editDialogTitle.textContent = isFolder ? "Add Folder" : "Add Page"
    $editDialogName.value = ""
    $editDialogURL.value = ""
    $editDialogURL.hidden = isFolder
    $editDialogFavicon.src = isFolder
      ? folderOutlineUri
      : "chrome://favicon/size/16@8x/"

    $editDialogDone.onclick = () => {
      if (!isFolder && !$editDialogURL.value) {
        return
      }

      const create = parentId =>
        chrome.bookmarks.create({
          parentId,
          title: $editDialogName.value,
          url: $editDialogURL.value
        })

      if (nodeId) {
        chrome.bookmarks.get(nodeId, ([node]) => {
          if (node.url) {
            create(node.parentId)
          } else {
            create(node.id)
          }
        })
      } else {
        create(bookmarksNavigator.getCurrentFolder())
      }

      $editDialog.close()
    }
  }

  function fixUrl(url) {
    if (url && url.search("://") === -1) {
      return `http://${url}`
    } else {
      return url
    }
  }
}
